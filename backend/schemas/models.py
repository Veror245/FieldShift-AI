from pydantic import BaseModel, Field
from typing import Literal
from datetime import date, datetime

class Task(BaseModel):
    task_id: str
    agent: str
    status: Literal["pending", "running", "complete", "failed"] = "pending"
    error: str | None = None
    
    def __getitem__(self, key):
        return getattr(self, key)

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
    
    columns: dict[str, str] = Field(default={
        "T2M": "mean temperature, °C",
        "T2M_MAX": "max temperature, °C",
        "T2M_MIN": "min temperature, °C",
        "PRECTOTCORR": "precipitation, mm/day",
        "ALLSKY_SFC_SW_DWN": "solar radiation, MJ/m²/day",
        "RH2M": "relative humidity, %",
        "WS2M": "wind speed, m/s",
    })
    
    temperature_c: float | None = Field(None, description="Mean temperature, °C")
    humidity_pct: float | None = Field(None, description="Mean relative humidity, %")
    wind_speed_ms: float | None = Field(None, description="Mean wind speed, m/s")
    precipitation_mm: float | None = Field(None, description="Total precipitation, mm")
    solar_radiation_mj: float | None = Field(None, description="Mean solar radiation, MJ/m²/day")

    def get(self, arg1):
        ...
    
    def __getitem__(self, key):
        return getattr(self, key)


class FieldLocation(BaseModel):
    lat: float
    lon: float
    region: str


class RotationEntry(BaseModel):
    crop_id: str
    season: Literal["kharif", "rabi", "zaid"]
    year: int


class SoilInputs(BaseModel):
    ph: float | None = None
    organic_carbon_pct: float | None = None
    texture: Literal["sandy","loamy_sand","sandy_loam","loam","silt_loam","clay_loam","clay"] | None = None
    nitrogen_ppm: float | None = None
    sampled_at: str | None = None
    lab_name: str | None = None


class Constraints(BaseModel):
    forbidden_crops: list[str] = Field(default_factory=list)
    required_crops: list[str] = Field(default_factory=list)
    max_water_requirement: Literal["low","medium","high"] | None = None


class InvestigationRequest(BaseModel):
    farm_id: str
    lat: float
    lon: float
    region: str
    current_rotation: list[RotationEntry]
    soil_inputs: SoilInputs
    objectives: str = Field(..., min_length=5)
    priorities: dict[str, float] | None = None
    constraints: Constraints = Field(default_factory=Constraints)


class InvestigationResponse(BaseModel):
    investigation_id: str
    status: Literal["complete", "partial", "failed"]
    farm_id: str
    advisor: dict | None
    rotation: dict | None
    agronomy: dict | None
    earth_obs: dict | None
    climate: dict | None
    error: str | None = None
    created_at: datetime