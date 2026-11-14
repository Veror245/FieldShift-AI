
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from ml.pipeline.clustering import (
    predict_climate_cluster,
    FEATURE_COLUMNS
)

from ml.pipeline.anomaly_detection import (
    predict_climate_anomalies
)

from ml.pipeline.climate_memory import (
    load_climate_memory,
    get_historical_baseline,
    get_similar_seasons,
    save_climate_memory
)


# Features used by the Isolation Forest models
ANOMALY_FEATURES = [
    "avg_temperature",
    "total_rainfall",
    "rainfall_std",
    "avg_solar_radiation",
    "avg_humidity",
    "avg_wind_speed",
    "rainy_day_ratio"
]


RAW_COLUMNS = [
    "date",
    "t2m_c",
    "t2m_max_c",
    "t2m_min_c",
    "precip_mm",
    "solar_mj",
    "humidity_pct",
    "wind_speed_ms"
]


def preprocess_climate_data(daily_data, target_year, target_season):
    """
    Convert raw daily NASA POWER observations into
    one seasonal record using the training notebook's
    feature engineering rules.
    """

    # 1. Validate raw input
    if not isinstance(daily_data, pd.DataFrame):
        raise TypeError("Input must be a pandas DataFrame.")

    if daily_data.empty:
        raise ValueError("Daily climate data is empty.")

    missing = [
        col for col in RAW_COLUMNS
        if col not in daily_data.columns
    ]

    if missing:
        raise ValueError(f"Missing raw columns: {missing}")

    if target_season not in ["Kharif", "Rabi", "Zaid"]:
        raise ValueError("Invalid season. Use Kharif, Rabi or Zaid.")

    if not isinstance(target_year, (int, np.integer)):
        raise TypeError("target_year must be an integer.")

    data = daily_data[RAW_COLUMNS].copy()

    # 2. Convert dates and numeric columns
    data["date"] = pd.to_datetime(data["date"], errors="coerce")

    numeric_columns = [
        "t2m_c",
        "t2m_max_c",
        "t2m_min_c",
        "precip_mm",
        "solar_mj",
        "humidity_pct",
        "wind_speed_ms"
    ]

    for col in numeric_columns:
        data[col] = pd.to_numeric(data[col], errors="coerce")

    if data.isnull().any().any():
        raise ValueError("Raw climate data contains missing or invalid values.")

    if data["date"].duplicated().any():
        raise ValueError("Duplicate daily dates found in climate data.")

    data = data.sort_values("date").reset_index(drop=True)

    # 3. Assign agricultural seasons
    month = data["date"].dt.month

    data["season"] = np.select(
        [
            month.isin([6, 7, 8, 9, 10]),
            month.isin([11, 12, 1, 2])
        ],
        ["Kharif", "Rabi"],
        default="Zaid"
    )

    # 4. Assign season year
    data["season_year"] = data["date"].dt.year

    rabi_mask = (
        (data["season"] == "Rabi") &
        (month.isin([11, 12]))
    )

    data.loc[rabi_mask, "season_year"] += 1

    # 5. Select requested season and year
    selected = data[
        (data["season_year"] == target_year) &
        (data["season"] == target_season)
    ].copy()

    if selected.empty:
        raise ValueError(
            f"No data found for {target_season} {target_year}."
        )

    # 6. Check that the requested season is complete
    if target_season == "Kharif":
        start_date = pd.Timestamp(target_year, 6, 1)
        end_date = pd.Timestamp(target_year, 10, 31)

    elif target_season == "Rabi":
        start_date = pd.Timestamp(target_year - 1, 11, 1)
        end_date = pd.Timestamp(target_year, 2, 1) + pd.offsets.MonthEnd(0)

    else:
        start_date = pd.Timestamp(target_year, 3, 1)
        end_date = pd.Timestamp(target_year, 5, 31)

    expected_dates = pd.date_range(start_date, end_date)

    actual_dates = pd.DatetimeIndex(selected["date"])

    if not actual_dates.equals(expected_dates):
        raise ValueError(
            f"Incomplete {target_season} {target_year} data. "
            f"Expected {len(expected_dates)} daily observations, "
            f"received {len(actual_dates)}."
        )

    # 7. Calculate seasonal features using training rules
    result = {
        "season_year": int(target_year),
        "season": target_season,

        "avg_temperature": selected["t2m_c"].mean(),

        "total_rainfall": selected["precip_mm"].sum(),

        "rainfall_std": selected["precip_mm"].std(),

        "avg_solar_radiation": selected["solar_mj"].mean(),

        "avg_humidity": selected["humidity_pct"].mean(),

        "avg_wind_speed": selected["wind_speed_ms"].mean(),

        "season_days": len(selected),

        "rainy_days": int(
            (selected["precip_mm"] > 0).sum()
        )
    }

    # 8. Calculate rainy day ratio
    result["rainy_day_ratio"] = (
        result["rainy_days"] / result["season_days"]
    )

    # 9. Return a one-row DataFrame
    return pd.DataFrame([result])



def validate_climate_input(climate_data: pd.DataFrame):
    """
    Validate incoming seasonal climate data
    before passing it to the ML models.
    """

    if not isinstance(climate_data, pd.DataFrame):
        raise TypeError(
            "Climate data must be a pandas DataFrame."
        )

    if climate_data.empty:
        raise ValueError(
            "No climate data was provided."
        )

    required_columns = [
        "season_year",
        "season",
        *FEATURE_COLUMNS,
        "season_days",
        "rainy_days"
    ]

    missing_columns = [
        col for col in required_columns
        if col not in climate_data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    if climate_data[required_columns].isnull().any().any():
        raise ValueError(
            "Climate data contains missing values."
        )

    allowed_seasons = ["Kharif", "Rabi", "Zaid"]

    invalid_seasons = set(
        climate_data["season"].unique()
    ) - set(allowed_seasons)

    if invalid_seasons:
        raise ValueError(
            f"Invalid agricultural seasons: {invalid_seasons}"
        )

    if len(climate_data) != 1:
        raise ValueError(
            "Currently, one seasonal observation must be provided."
        )

    return True


def get_cluster_analysis(climate_data: pd.DataFrame):
    """
    Generate cluster information for the incoming
    seasonal observation.
    """

    # Locate and load the trained models
    ML_DIR = Path(__file__).resolve().parent
    MODEL_DIR = ML_DIR / "models"

    scaler = joblib.load(
        MODEL_DIR / "feature_scaler.pkl"
    )

    kmeans = joblib.load(
        MODEL_DIR / "kmeans_model.pkl"
    )

    # Load historical climate observations
    historical_data = load_climate_memory()

    # Extract the features used during training
    X = climate_data[FEATURE_COLUMNS].copy()

    # Scale using the previously trained scaler
    scaled_features = pd.DataFrame(
    scaler.transform(X),
    columns=FEATURE_COLUMNS,
    index=X.index
    )

    # Predict the current cluster
    cluster_id = int(
        kmeans.predict(scaled_features)[0]
    )

    # Calculate distance to assigned centroid
    centroid_scaled = kmeans.cluster_centers_[cluster_id]

    distance = float(
    np.linalg.norm(
        scaled_features.iloc[0].to_numpy() - centroid_scaled
         )
    )

    # Convert centroids back to original climate units
    original_centroids = scaler.inverse_transform(
        kmeans.cluster_centers_
    )

    # Store information about every cluster
    season_clusters = []

    for cluster_number in range(kmeans.n_clusters):

        cluster_history = historical_data[
            historical_data["cluster"] == cluster_number
        ]

        # Find the dominant agricultural season
        if cluster_history.empty:
            label = f"Cluster {cluster_number}"
        else:
            dominant_season = (
                cluster_history["season"].mode().iloc[0]
            )
            label = f"{dominant_season}-like"

        # Get the centroid in original climate units
        centroid = {
            feature: float(original_centroids[cluster_number][i])
            for i, feature in enumerate(FEATURE_COLUMNS)
        }

        season_clusters.append({
            "cluster_id": cluster_number,
            "label": label,
            "size": int(len(cluster_history)),
            "centroid": centroid,
            "features": FEATURE_COLUMNS.copy()
        })

    # Get the current season's cluster information
    current_season = {
        "year": int(climate_data["season_year"].iloc[0]),
        "cluster_id": cluster_id,
        "label": season_clusters[cluster_id]["label"],
        "distance_to_centroid": distance
    }

    return {
        "season_clusters": season_clusters,
        "current_season": current_season
    }



def get_climate_analysis(
    daily_data,
    target_year,
    target_season
):
    # Step 1: Convert raw daily data into seasonal features
    climate_data = preprocess_climate_data(
        daily_data,
        target_year=target_year,
        target_season=target_season
    )

    # Step 2: Validate processed seasonal data
    validate_climate_input(climate_data)

    # Step 3: Perform K-Means clustering
    cluster_result = get_cluster_analysis(climate_data)

    # Step 4: Detect climate anomalies
    anomaly_result = predict_climate_anomalies(
        climate_data,
        ANOMALY_FEATURES
    )

    # Step 5: Extract current season information
    year = int(climate_data["season_year"].iloc[0])
    season = climate_data["season"].iloc[0]

    # Step 6: Prepare anomaly information
    anomalies = []

    anomaly_status = int(anomaly_result["anomaly"].iloc[0])
    anomaly_score = float(anomaly_result["anomaly_score"].iloc[0])

    if anomaly_status == -1:
        anomaly_features = {
            feature: float(climate_data[feature].iloc[0])
            for feature in ANOMALY_FEATURES
        }

        anomalies.append({
            "date_range": f"{season} {year}",
            "score": anomaly_score,
            "features": anomaly_features
        })

    # Step 7: Compare rainfall with historical baseline
    recent_precip = float(
        climate_data["total_rainfall"].iloc[0]
    )

    try:
        baseline = get_historical_baseline(
            season=season,
            current_year=year
        )

        historical_avg = float(baseline["historical_avg_mm"])

        if historical_avg != 0:
            deviation_pct = (
                (recent_precip - historical_avg)
                / historical_avg
            ) * 100
        else:
            deviation_pct = None

    except ValueError:
        historical_avg = None
        deviation_pct = None

    # Step 8: Prepare final response
    response = {
        "season_clusters": cluster_result["season_clusters"],
        "current_season": cluster_result["current_season"],
        "anomalies": anomalies,

        "baseline_comparison": {
            "recent_precip_mm": recent_precip,
            "historical_avg_mm": historical_avg,
            "deviation_pct": deviation_pct
        },

        "crop_stress_level": None
    }

    # Step 9: Save the current observation to Climate Memory
    memory_record = climate_data.copy()

    memory_record["cluster"] = (
        cluster_result["current_season"]["cluster_id"]
    )

    memory_record["anomaly"] = anomaly_status
    memory_record["anomaly_score"] = anomaly_score

    save_climate_memory(memory_record)

    # Step 10: Return final result
    return response
