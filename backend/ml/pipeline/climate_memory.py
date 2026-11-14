
from pathlib import Path

import pandas as pd


# Locate the ML directory automatically
ML_DIR = Path(__file__).resolve().parents[1]

# Define the Climate Memory storage location
MEMORY_DIR = ML_DIR / "data" / "processed"
MEMORY_FILE = MEMORY_DIR / "climate_memory.csv"


def save_climate_memory(new_data: pd.DataFrame):
    """
    Save seasonal climate observations to Climate Memory.

    Existing records are updated if the same season_year
    and season already exist.
    """

    # Check whether incoming data is empty
    if new_data.empty:
        raise ValueError("No climate data provided.")

    # Required identifying columns
    required_columns = ["season_year", "season"]

    # Check for missing columns
    missing_columns = [
        col for col in required_columns
        if col not in new_data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    # Check for missing identifiers
    if new_data[required_columns].isnull().any().any():
        raise ValueError(
            "season_year or season contains missing values."
        )

    # Create storage directory if it doesn't exist
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing memory if available
    if MEMORY_FILE.exists():
        existing_data = pd.read_csv(MEMORY_FILE)

        # Combine old and new observations
        combined_data = pd.concat(
            [existing_data, new_data],
            ignore_index=True,
            sort=False
        )
    else:
        combined_data = new_data.copy()

    # Keep only the latest record for each season
    combined_data = combined_data.drop_duplicates(
        subset=["season_year", "season"],
        keep="last"
    )

    # Sort records chronologically
    combined_data = combined_data.sort_values(
        by=["season_year", "season"]
    )

    # Save updated Climate Memory
    combined_data.to_csv(
        MEMORY_FILE,
        index=False
    )

    return combined_data


def load_climate_memory():
    """
    Load historical climate observations from Climate Memory.
    """

    if not MEMORY_FILE.exists():
        raise FileNotFoundError(
            "Climate Memory does not exist yet. "
            "Save climate observations first."
        )

    memory = pd.read_csv(MEMORY_FILE)

    return memory


def get_historical_baseline(
    season: str,
    current_year: int,
    rainfall_column: str = "total_rainfall"
):
    """
    Calculate the historical average rainfall
    for the same agricultural season.
    """

    memory = load_climate_memory()

    historical_data = memory[
        (memory["season"] == season) &
        (memory["season_year"] < current_year)
    ]

    if historical_data.empty:
        raise ValueError(
            f"No historical records found for {season}."
        )

    historical_average = historical_data[
        rainfall_column
    ].mean()

    return {
        "season": season,
        "years_compared": len(historical_data),
        "historical_avg_mm": round(
            float(historical_average), 2
        )
    }


def get_similar_seasons(
    cluster_id: int,
    exclude_year: int | None = None
):
    """
    Retrieve historical seasons belonging
    to the same K-Means cluster.
    """

    memory = load_climate_memory()

    similar_data = memory[
        memory["cluster"] == cluster_id
    ].copy()

    if exclude_year is not None:
        similar_data = similar_data[
            similar_data["season_year"] != exclude_year
        ]

    return similar_data.sort_values(
        by="season_year"
    )
