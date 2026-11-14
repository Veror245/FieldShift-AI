from ..supervisor.state import InvestigationState


class ClimateState(InvestigationState, total=False):
    """Single-node subgraph. No private scratch fields."""
    pass