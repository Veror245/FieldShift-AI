import numpy as np
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest


# Find the ML directory automatically
ML_DIR = Path(__file__).resolve().parents[1]

# Define storage locations
MODEL_DIR = ML_DIR / "models"
PROCESSED_DIR = ML_DIR / "data" / "processed"

def prepare_features(data: pd.DataFrame, feature_columns: list[str]):

    # Check whether required features exist
    missing_columns = [
        col for col in feature_columns
        if col not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing climate features: {missing_columns}"
        )

    # Extract the required features
    X = data[feature_columns].copy()

    # Ensure all features are numeric
    X = X.apply(pd.to_numeric, errors="coerce")

    # Check for missing values
    if X.isnull().any().any():
        raise ValueError("Climate data contains missing or non-numeric values.")

    # Check for infinite values
    if not np.isfinite(X.to_numpy()).all():
        raise ValueError("Climate data contains infinite values.")

    return X



def train_seasonal_anomaly_models(
    data: pd.DataFrame,
    feature_columns: list[str],
    season_column: str = "season"
):
    """
    Train a separate Isolation Forest model
    for each agricultural season.
    """

    # Check whether the season column exists
    if season_column not in data.columns:
        raise ValueError(f"Missing season column: {season_column}")

    if data[season_column].isnull().any():
        raise ValueError("Season column contains missing values.")

    # Store results from all seasons
    seasonal_results = []

    # Create storage directories
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # Process each season separately
    for season in data[season_column].unique():

        # Select observations belonging to this season
        season_data = data[data[season_column] == season].copy()

        # Prepare climate features
        X = prepare_features(season_data, feature_columns)
        
        if len(X) < 2:
           raise ValueError(
               f"Not enough observations to train a model for {season}."
         )

        # Create a separate Isolation Forest
        isolation_model = IsolationForest(
            n_estimators=200,
            contamination="auto",
            random_state=42
        )

        # Train the model
        isolation_model.fit(X)

        # Save this season's model
        model_path = MODEL_DIR / f"isolation_forest_{season.lower()}.pkl"
        joblib.dump(isolation_model, model_path)

        # Detect anomalies in historical observations
        predictions = isolation_model.predict(X)
        anomaly_scores = -isolation_model.score_samples(X)

        # Store predictions
        season_data["anomaly"] = predictions
        season_data["anomaly_score"] = anomaly_scores

        seasonal_results.append(season_data)

    # Combine results from all seasons
    anomaly_results = pd.concat(
        seasonal_results,
        ignore_index=True
    )

    # Save combined historical results
    anomaly_results.to_csv(
        PROCESSED_DIR / "climate_anomaly_results.csv",
        index=False
    )

    return anomaly_results

def predict_climate_anomalies(
    new_data: pd.DataFrame,
    feature_columns: list[str],
    season_column: str = "season"
):
    """
    Load the appropriate seasonal Isolation Forest model
    and detect anomalies in new climate data.
    """
    
    # Check whether incoming data is empty
    if new_data.empty:
        raise ValueError("No climate observations provided for prediction.")

    # Check whether the season column exists
    if season_column not in new_data.columns:
        raise ValueError(f"Missing season column: {season_column}")

    if new_data[season_column].isnull().any():
        raise ValueError("Season column contains missing values.")

    # Store prediction results
    results = new_data.copy()

    results["anomaly"] = np.nan
    results["anomaly_score"] = np.nan

    # Process each season separately
    for season in new_data[season_column].unique():

        # Select observations belonging to this season
        mask = new_data[season_column] == season
        season_data = new_data.loc[mask]

        # Prepare climate features
        X = prepare_features(season_data, feature_columns)

        # Locate the appropriate seasonal model
        model_path = MODEL_DIR / f"isolation_forest_{season.lower()}.pkl"

        if not model_path.exists():
            raise FileNotFoundError(
                f"No trained model found for season: {season}"
            )

        # Load the trained model
        isolation_model = joblib.load(model_path)

        # Predict anomalies
        predictions = isolation_model.predict(X)

        # Calculate anomaly scores
        anomaly_scores = -isolation_model.score_samples(X)

        # Store predictions
        results.loc[mask, "anomaly"] = predictions
        results.loc[mask, "anomaly_score"] = anomaly_scores

    results["anomaly"] = results["anomaly"].astype(int)

    return results