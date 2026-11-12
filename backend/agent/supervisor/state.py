from typing import Annotated, Literal, TypedDict
from enum import Enum

from backend.schemas.models import Task, EarthObsResult

class AgentName(str, Enum):
    SUPERVISOR = "supervisor"
    EARTH_OBS = "earth_obs"
    CLIMATE = "climate"
    SOIL = "soil"
    ROTATION = "rotation"
    RISK_AUDITOR = "risk_auditor"
    ADVISOR = "advisor"

def _merge_tasks(left: list[Task], right: list[Task]):
    by_id = {t.task_id: t for t in left}
    by_id.update({t.task_id: t for t in right})
    return list(by_id.values())

class InvestigationState(TypedDict, total=False):
    
    investigation_id: str
    farm_id: str

    #fields
    lat: float
    lon: float
    region: str
    
     # inputs
    soil_inputs: dict
    current_rotation: list[dict]
    objectives: str
    priorities: dict[str, float]
    constraints: dict

    #orchestratin agents
    next_action: list[str]           
    tasks: Annotated[list[Task], _merge_tasks]
    missing_info: list[str]
    curr_agent: list[AgentName]         

    # results
    earth_obs: EarthObsResult | None
    climate: dict | None
    agronomy: dict | None
    rotation: dict | None
    audit: dict | None
    advisor: dict | None

    approval: Literal["pending", "approved", "revise"]
    
    step_count: int
    revision_count: int
    max_steps: int
    

