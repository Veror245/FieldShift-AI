import asyncio
from functools import partial
from pathlib import Path
from uuid import uuid4

import pandas as pd

from .state import ClimateState
from ..supervisor.state import Task
from ...ml.main import get_climate_analysis
from datetime import date


REQUIRED_OUTPUT_KEYS = {
    "season_clusters",
    "current_season",
    "anomalies",
    "baseline_comparison",
}


def current_season(today: date | None = None) -> tuple[int, str]:
    """
    Return (year, season) for the most recent agricultural season.

    Kharif: Jun–Oct  → 6, 7, 8, 9, 10
    Rabi:   Nov–Feb  → 11, 12, 1, 2
    Zaid:   Mar–May  → 3, 4, 5

    Year convention: Kharif and Zaid use the calendar year of the season.
    Rabi spans a year boundary — Nov/Dec belong to year Y, Jan/Feb belong
    to year Y-1 (so Rabi 2024 = Nov 2024 → Feb 2025).
    """
    today = today or date.today()
    m, y = today.month, today.year

    if 6 <= m <= 10:
        return y, "Kharif"
    if m in (11, 12):
        return y, "Rabi"
    if m in (1, 2):
        return y - 1, "Rabi"
    return y, "Zaid"   # Mar, Apr, May


async def climate_node(state: ClimateState) -> dict:
    task_id = f"climate:{uuid4()}"

    # --- 1. Read earth_obs output ---
    earth_obs = state.get("earth_obs")
    if not earth_obs or not earth_obs.get("csv_file_path"):
        return {
            "climate": None,
            "tasks": [Task(task_id=task_id, agent="climate", status="failed",
                           error="earth_obs missing or has no csv_file_path")],
        }

    # --- 2. Load daily data (the ML function handles column transformation internally) ---
    csv_path = Path(earth_obs["csv_file_path"])
    if not csv_path.exists():
        return {
            "climate": None,
            "tasks": [Task(task_id=task_id, agent="climate", status="failed",
                           error=f"CSV not found at {csv_path}")],
        }

    try:
        daily_data = pd.read_csv(csv_path)
    except Exception as e:
        return {
            "climate": None,
            "tasks": [Task(task_id=task_id, agent="climate", status="failed",
                           error=f"failed to load CSV: {e}")],
        }

    # --- 3. Current year + season ---
    # v2: derive from datetime.now() or let farmer pick in intake
    # Must match ML training cutoff — currently 2025 / Kharif per ML team
    auto_year, auto_season = current_season(date.today())
    target_year = state.get("climate_target_year", auto_year)
    target_season = state.get("climate_target_season", auto_season)

    # --- 4. Run ML (offloaded to thread — KMeans + IsolationForest is CPU-bound) ---
    try:
        result = await asyncio.to_thread(
            partial(
                get_climate_analysis,
                daily_data,
                target_year=target_year,
                target_season=target_season,
            )
        )
    except Exception as e:
        return {
            "climate": None,
            "tasks": [Task(task_id=task_id, agent="climate", status="failed",
                           error=f"get_climate_analysis failed: {e}")],
        }

    # --- 5. Sanity-check output shape (fails fast if ML contract drifts) ---
    missing = REQUIRED_OUTPUT_KEYS - set(result.keys())
    if missing:
        return {
            "climate": None,
            "tasks": [Task(task_id=task_id, agent="climate", status="failed",
                           error=f"ML output missing required keys: {sorted(missing)}")],
        }

    return {
        "climate": result,
        "tasks": [Task(task_id=task_id, agent="climate", status="complete")],
    }