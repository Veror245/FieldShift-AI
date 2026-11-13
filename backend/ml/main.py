
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


def get_climate_analysis(climate_data):

    # Step 1: Validate incoming climate data
    validate_climate_input(climate_data)

    # Step 2: Perform K-Means clustering
    cluster_result = get_cluster_analysis(climate_data)

    # Step 3: Detect climate anomalies
    anomaly_result = predict_climate_anomalies(
        climate_data,
        ANOMALY_FEATURES
    )

    # Step 4: Extract current season information
    year = int(climate_data["season_year"].iloc[0])
    season = climate_data["season"].iloc[0]

    # Step 5: Prepare anomaly information
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

    # Step 6: Compare rainfall with historical baseline
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

    # Step 7: Prepare final response
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

    # Step 8: Save the current observation to Climate Memory
    memory_record = climate_data.copy()

    memory_record["cluster"] = (
        cluster_result["current_season"]["cluster_id"]
    )

    memory_record["anomaly"] = anomaly_status
    memory_record["anomaly_score"] = anomaly_score

    save_climate_memory(memory_record)

    # Step 9: Return the final result
    return response