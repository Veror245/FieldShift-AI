
import joblib
import pandas as pd

from pathlib import Path
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


# Locate the ML models directory
MODEL_DIR = Path(__file__).resolve().parents[1] / "models"



FEATURE_COLUMNS = [
    "avg_temperature",
    "total_rainfall",
    "rainfall_std",
    "avg_solar_radiation",
    "avg_humidity",
    "avg_wind_speed",
    "rainy_day_ratio"
]



def train_climate_clusters(seasonal_features, n_clusters=3):

    # Select the required climate features
    X = seasonal_features[FEATURE_COLUMNS].copy()

    # Create and fit the scaler
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(X)

    # Convert scaled features into a DataFrame
    scaled_df = pd.DataFrame(
        scaled_features,
        columns=FEATURE_COLUMNS,
        index=X.index
    )

    # Create and train the K-Means model
    kmeans = KMeans(
        n_clusters=n_clusters,
        random_state=42,
        n_init=10
    )

    cluster_labels = kmeans.fit_predict(scaled_df)

    # Save the trained scaler and model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(scaler, MODEL_DIR / "feature_scaler.pkl")
    joblib.dump(kmeans, MODEL_DIR / "kmeans_model.pkl")

    # Add cluster labels to the original dataset
    results = seasonal_features.copy()
    results["cluster"] = cluster_labels

    return results


def predict_climate_cluster(new_data):

    # Load the saved scaler and model
    scaler = joblib.load(MODEL_DIR / "feature_scaler.pkl")
    kmeans = joblib.load(MODEL_DIR / "kmeans_model.pkl")

    # Select the same features used during training
    X = new_data[FEATURE_COLUMNS].copy()

    # Transform using the existing scaler
    scaled_features = scaler.transform(X)

    # Convert scaled features into a DataFrame
    scaled_df = pd.DataFrame(
        scaled_features,
        columns=FEATURE_COLUMNS,
        index=X.index
    )

    # Predict cluster
    predictions = kmeans.predict(scaled_df)

    return predictions
