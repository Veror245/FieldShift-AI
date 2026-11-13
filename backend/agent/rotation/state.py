from ..supervisor.state import InvestigationState

class RotationState(InvestigationState, total=False):
    """Single-node subgraph. No private scratch fields."""
    pass