import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.agent.rotation.graph import DIMENSIONS
from backend.schemas.models import InvestigationRequest, InvestigationResponse
from backend.agent.main import app as agent_app

app = FastAPI(title = "FieldShift AI", description = "An AI-powered crop rotation advisor for smallholder farmers.", version = "0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   #frontend port n url
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/investigations", response_model=InvestigationResponse)
async def create_investigation(req: InvestigationRequest):
    investigation_id = f"inv-{uuid.uuid4().hex[:8]}"

    # Build LangGraph input state
    initial_state = {
        "investigation_id": investigation_id,
        "farm_id": req.farm_id,
        "lat": req.lat,
        "lon": req.lon,
        "region": req.region,
        "current_rotation": [r.model_dump() for r in req.current_rotation],
        "soil_inputs": req.soil_inputs.model_dump(),
        "objectives": req.objectives,
        "priorities": req.priorities or {k: 0.5 for k in DIMENSIONS},
        "constraints": req.constraints.model_dump(),
    }

    try:
        result = await agent_app.ainvoke(initial_state) # type: ignore
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation failed: {e}")

    if not result.get("advisor"):
        # Partial success — everything except advisor
        return InvestigationResponse(
            investigation_id=investigation_id,
            status="partial",
            farm_id=req.farm_id,
            advisor=None,
            rotation=result.get("rotation"),
            agronomy=result.get("agronomy"),
            earth_obs=_strip_internal(result.get("earth_obs")),
            created_at=datetime.now(timezone.utc),
        )

    return InvestigationResponse(
        investigation_id=investigation_id,
        status="complete",
        farm_id=req.farm_id,
        advisor=result["advisor"],
        rotation=result["rotation"],
        agronomy=result["agronomy"],
        earth_obs=_strip_internal(result["earth_obs"]),
        created_at=datetime.now(timezone.utc),
    )


def _strip_internal(earth_obs: dict | None) -> dict | None:
    """Remove csv_file_path and columns before returning to frontend."""
    if not earth_obs:
        return None
    return {k: v for k, v in earth_obs.items()
            if k not in ("csv_file_path", "columns", "source_endpoint")}