from pydantic import BaseModel, Field

from backend.agent.supervisor.state import InvestigationState


class StrategyExplanation(BaseModel):
    strategy_id: str = Field(..., description="Must match one of the input strategy IDs exactly")
    plain_summary: str = Field(..., description="1-2 sentences in plain language")
    why_suggested: str = Field(..., description="1 short paragraph explaining the reasoning")
    key_benefits: list[str] = Field(..., description="2-4 concrete benefits")
    key_drawbacks: list[str] = Field(..., description="1-3 concrete drawbacks or risks")
    uncertainties: list[str] = Field(..., description="What we don't know — data gaps, unverified assumptions")
    farmer_questions: list[str] = Field(..., description="0-2 questions the farmer should consider asking a local expert")
    sources: list[str] = Field(..., description="Which inputs informed this: e.g. 'soil_lab', 'nasa_power', 'crop_kb', 'scoring'")


class AdvisorOutput(BaseModel):
    overview: str = Field(..., description="2-3 sentence summary of the whole investigation")
    strategy_explanations: list[StrategyExplanation]
    comparison: str = Field(..., description="1 paragraph comparing the Pareto-front strategies side by side")
    recommendation_note: str = Field(..., description="DO NOT pick a winner. Say what to weigh based on the farmer's stated priorities.")
    next_steps: list[str] = Field(..., description="2-4 concrete actions the farmer can take next")
    overall_uncertainties: list[str] = Field(..., description="Investigation-level gaps — missing data, regional assumptions")


class AdvisorState(InvestigationState, total=False):
    pass