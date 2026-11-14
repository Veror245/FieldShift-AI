import httpx
import pandas as pd

from datetime import date, datetime, timezone

from pathlib import Path
from uuid import uuid4

from .state import EarthObsState
from ...schemas.models import EarthObsResult   
from ..supervisor.state import Task



DATA_DIR = Path("backend/data/earth_obs")
COLUMN_MAP = {
    "T2M": "t2m_c",
    "T2M_MAX": "t2m_max_c",
    "T2M_MIN": "t2m_min_c",
    "PRECTOTCORR": "precip_mm",
    "ALLSKY_SFC_SW_DWN": "solar_mj",
    "RH2M": "humidity_pct",
    "WS2M": "wind_speed_ms",
}

async def fetch_nasa_power(lat: float, lon: float, start: str, end: str) -> pd.DataFrame:
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    params = {
        "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M,WS2M",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": start,
        "end": end,
        "format": "JSON",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    df = pd.DataFrame(data["properties"]["parameter"])
    df = df.rename(columns=COLUMN_MAP)
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "date"
    df.replace(-999, pd.NA, inplace=True)
    
    
    
    return df



async def earth_obs_node(state: EarthObsState) -> dict:
    print(f"Entereted Earth")
    task_id = f"earth_obs:{uuid4()}"
    lat = state["lat"] # type: ignore
    lon = state["lon"] # type: ignore
    start, end = "19950101", "20251231"

   
    try:
        df = await fetch_nasa_power(lat, lon, start, end)
    except httpx.HTTPError as e:
        return {
            "tasks": [Task(task_id=task_id, agent="earth_obs",
                           status="failed", error=str(e))],
        }

    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = DATA_DIR / f"{state['investigation_id']}.csv" # type: ignore
    df.to_csv(csv_path, index=True)

    result = EarthObsResult(
        source="NASA_POWER",
        source_endpoint="https://power.larc.nasa.gov/api/temporal/daily/point",
        grid_resolution_deg=0.5,
        fetched_at=datetime.now(timezone.utc),
        missing_days=int(df["t2m_c"].isna().sum()),
        start_date=date(int(start[:4]), int(start[4:6]), int(start[6:])),
        end_date=date(int(end[:4]), int(end[4:6]), int(end[6:])),
        n_days=len(df),
        csv_file_path=str(csv_path),
        temperature_c=_safe_mean(df["t2m_c"]),
        humidity_pct=_safe_mean(df["humidity_pct"]),
        wind_speed_ms=_safe_mean(df["wind_speed_ms"]),
        precipitation_mm=_safe_sum(df["precip_mm"]),
        solar_radiation_mj=_safe_mean(df["solar_mj"]),
    )

    return {
        "earth_obs": result.model_dump(mode="json"),
        "tasks": [Task(task_id=task_id, agent="earth_obs", status="complete")],
    }


def _safe_mean(s: pd.Series) -> float | None:
    if s.dropna().empty:
        return None
    return float(s.mean())

def _safe_sum(s: pd.Series) -> float | None:
    if s.dropna().empty:
        return None
    return float(s.sum())

if __name__ == "__main__":
    import asyncio

    lat, lon = 35.0, -120.0
    start, end = "20220101", "20221231"

    df = asyncio.run(fetch_nasa_power(lat, lon, start, end))
    print(df.head())
