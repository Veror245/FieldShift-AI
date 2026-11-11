from ..supervisor.state import InvestigationState, AgentName

MAX_REVISIONS = 3

def supervisor_node(state: InvestigationState) -> dict:
    
    def advance(**updates) -> dict:
        return {**updates, "step_count": state.get("step_count", 0) + 1}
    
    if not state.get("objectives"):
        return advance(
            next_action= ["await_farmer"],
            missing_info= ["What are your main goals for this field?"],
        )
        
    if state.get("step_count", 0) >= state.get("max_steps", 25):
        return advance(next_action=["finalize"])
    
    if not state.get("earth_obs") and not state.get("agronomy"):
        return advance(next_action=[AgentName.EARTH_OBS, AgentName.SOIL], current_agents=[AgentName.EARTH_OBS, AgentName.SOIL], missing_info=[])
    
    if state.get("earth_obs") and not state.get("climate"):
        return advance(next_action=[AgentName.CLIMATE], current_agents=[AgentName.CLIMATE])
    
    if state.get("earth_obs") and state.get("climate") and state.get("agronomy") and not state.get("rotation"):
        return advance(next_action=[AgentName.ROTATION], current_agents=[AgentName.ROTATION])
    
    if state.get("rotation") and not state.get("advisor"):
        return advance(next_action=[AgentName.ADVISOR], current_agents=[AgentName.ADVISOR])
    
    if state.get("advisor"):
        approval = state.get("approval", "pending")
        if approval == "approved":
            return advance(next_action=["finalize"])
        if approval == "revise":
            if state.get("revision_count", 0) >= MAX_REVISIONS:
                return advance(
                    next_action=["await_farmer"],
                    missing_info=["Please pick one of the existing strategies or provide specific guidance."], #disable revise button in ui
                )
            return advance(
                next_action=[AgentName.ROTATION],
                current_agents=[AgentName.ROTATION],
                revision_count=state.get("revision_count", 0) + 1,
            )
    
    return advance(next_action=["await_farmer"])
      