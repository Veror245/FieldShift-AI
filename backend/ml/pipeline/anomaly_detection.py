
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest


# Find the ML directory automatically
ML_DIR = Path(__file__).resolve().parents[1]

# Define storage locations
MODEL_DIR = ML_DIR / "models"
PROCESSED_DIR = ML_DIR / "data" / "processed"


def detect_climate_anomalies(
    data: pd.DataFrame,
    feature_columns: list[str]
):
    """
    Train an Isolation Forest model and detect
    unusual climate observations.
    """

    # Check whether required features exist
    missing_columns = [
        col for col in feature_columns
        if col not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing climate features: {missing_columns}"
        )

    # Extract climate features
    X = data[feature_columns].copy()

    # Check for missing or invalid values
    if X.isnull().any().any():
        raise ValueError("Climate data contains missing values.")

    if not X.map(lambda value: pd.notna(value) and abs(value) != float("inf")).all().all():
        raise ValueError("Climate data contains invalid values.")

    if len(X) < 2:
        raise ValueError("At least two observations are required.")

    # Create the Isolation Forest model
    isolation_model = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=42
    )

    # Train the model
    isolation_model.fit(X)

    # Predict anomalies
    predictions = isolation_model.predict(X)

    # Calculate anomaly scores
    anomaly_scores = -isolation_model.score_samples(X)

    # Store the results
    anomaly_results = data.copy()

    anomaly_results["anomaly"] = predictions
    anomaly_results["anomaly_score"] = anomaly_scores

    # Create storage directories if needed
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # Save the trained model
    joblib.dump(
        isolation_model,
        MODEL_DIR / "isolation_forest_model.pkl"
    )

    # Save anomaly results
    anomaly_results.to_csv(
        PROCESSED_DIR / "climate_anomaly_results.csv"
    )

    return isolation_model, anomaly_results
