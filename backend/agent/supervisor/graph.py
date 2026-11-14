from ..supervisor.state import InvestigationState, AgentName
from langgraph.graph import END
from langgraph.types import Send

MAX_REVISIONS = 3

def supervisor_node(state: InvestigationState) -> dict:
    
    print(f"Entereted Supervisor")
    
    def advance(**updates) -> dict:
        return {**updates, "step_count": state.get("step_count", 0) + 1}
    
    if not state.get("objectives"):
        return advance(
            next_action= ["await_farmer"],
            missing_info= ["What are your main goals for this field?"],
        )
    
    failed = [t for t in state.get("tasks", []) if t["status"] == "failed"]
    if any(t["agent"] == "earth_obs" for t in failed) and state.get("step_count", 0) > 3:
        return advance(next_action=["await_farmer"],
                    missing_info=["Earth observation data unavailable. Please retry."])
        
    if state.get("step_count", 0) >= state.get("max_steps", 25):
        return advance(next_action=["finalize"])
    
    if not state.get("earth_obs") and not state.get("agronomy"):
        return advance(next_action=[AgentName.EARTH_OBS, AgentName.SOIL], current_agents=[AgentName.EARTH_OBS, AgentName.SOIL], missing_info=[])
    
    if state.get("earth_obs") and not state.get("climate"):
        return advance(next_action=[AgentName.CLIMATE], current_agents=[AgentName.CLIMATE])
    
    if state.get("earth_obs") and state.get("climate") and state.get("agronomy") and not state.get("rotation"):
        return advance(next_action=[AgentName.ROTATION], current_agents=[AgentName.ROTATION])
    
    if state.get("rotation") and not state.get("advisor"):
        failed = [t for t in state.get("tasks", [])
                if t.agent == "advisor" and t.status == "failed"]
        if failed:
            return advance(
                next_action=["await_farmer"],
                current_agents=[],
                missing_info=[f"Advisor unavailable — strategies ready without explanations. Error: {failed[-1].error[:200]}"], # type: ignore
            )
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
    
    
AGENT_NODES = {
    AgentName.EARTH_OBS: "earth_obs",
    AgentName.SOIL: "soil",
    AgentName.CLIMATE: "climate",
    AgentName.ROTATION: "rotation",
    AgentName.RISK_AUDITOR: "risk_auditor",
    AgentName.ADVISOR: "advisor",
}

def route_from_supervisor(state: InvestigationState):
    actions = state.get("next_action", ["await_farmer"])

    #agent targets, or control signlas like "await_farmer" or "finalize"
    agent_targets = [AGENT_NODES[a] for a in actions if a in AGENT_NODES] # type: ignore
    control_targets = [a for a in actions if a not in AGENT_NODES]

    #return control sigals firsta lways
    if control_targets:
        control = control_targets[0]
        if control == "finalize":
            return END
        return "await_farmer"   

    #if single agent
    if len(agent_targets) == 1:
        return agent_targets[0]

    #parallel agents
    return [Send(target, state) for target in agent_targets]