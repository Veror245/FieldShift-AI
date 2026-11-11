from pydantic import BaseModel, Field
from typing import Literal
from datetime import date, datetime

class Task(BaseModel):
    task_id: str
    agent: str
    status: Literal["pending", "running", "complete", "failed"] = "pending"
    error: str | None = None

class EarthObsResult(BaseModel):
    
    source: str = Field(..., description="Data source, e.g. 'NASA_POWER'")
    source_endpoint: str = Field(..., description="Full API endpoint used")
    grid_resolution_deg: float = Field(..., description="Grid cell size in degrees (~0.5 for POWER)")
    fetched_at: datetime = Field(..., description="UTC timestamp of fetch")
    missing_days: int = Field(..., description="Days where NASA returned -999")
   
    start_date: date
    end_date: date
    n_days: int

    csv_file_path: str = Field(..., description="Local path or s3:// URI")
    columns: dict[str, str] = Field(
        default_factory=dict,
        description="CSV column name -> human-readable description with units",
    )

    temperature_c: float | None = Field(None, description="Mean temperature, °C")
    humidity_pct: float | None = Field(None, description="Mean relative humidity, %")
    wind_speed_ms: float | None = Field(None, description="Mean wind speed, m/s")
    precipitation_mm: float | None = Field(None, description="Total precipitation, mm")
    solar_radiation_mj: float | None = Field(None, description="Mean solar radiation, MJ/m²/day")