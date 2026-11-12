from langgraph.graph import START, END, StateGraph
from ..agent.supervisor.state import InvestigationState, AgentName
from ..agent.supervisor.graph import supervisor_node, AGENT_NODES, route_from_supervisor
from ..agent.earth_obser.graph import earth_obs_node

import asyncio


def stub_earth_obs(state): return {"earth_obs": {"stub": True}}
def stub_soil(state):      return {"agronomy":   {"stub": True}}
def stub_climate(state):   return {"climate":    {"stub": True}}
def stub_rotation(state):  return {"rotation":   {"strategies": []}}
def stub_advisor(state):   return {"advisor":    {"explanations": []}}
def await_farmer(state):  return {}
def join_evidence_node(state: InvestigationState) -> dict:
    return {}

graph = StateGraph(InvestigationState)

graph.add_node("supervisor", supervisor_node)
graph.add_node("earth_obs", earth_obs_node)
graph.add_node("soil", stub_soil)
graph.add_node("climate", stub_climate)
graph.add_node("rotation", stub_rotation)
graph.add_node("advisor", stub_advisor)
graph.add_node("await_farmer", await_farmer)
graph.add_node("join", join_evidence_node)


graph.add_edge(START, "supervisor")
graph.add_edge("earth_obs", "join")
graph.add_edge("soil","join")

graph.add_edge("join", "supervisor")

graph.add_edge("climate",  "supervisor")
graph.add_edge("rotation", "supervisor")
graph.add_edge("advisor",  "supervisor")

graph.add_conditional_edges(
    "supervisor",
    route_from_supervisor,
    {
        "earth_obs": "earth_obs",
        "soil": "soil",
        "climate": "climate",
        "rotation": "rotation",
        "advisor": "advisor",
        "await_farmer": "await_farmer",
        END: END,
    },
)



if __name__ == "__main__":
    
    app = graph.compile()
    
    async def main():
        async for event in app.astream(
            {
                "objectives": "reduce water, improve soil",
                "investigation_id": "test-001",
                "centroid_lat": 31.52,
                "centroid_lon": 74.35,
            },
            stream_mode="updates",  # each node's delta
        ):
            for node_name, delta in event.items():
                print(f"\n=== {node_name} ===")
                print(delta)
    
    asyncio.run(main())
   
    # png = app.get_graph().draw_mermaid_png()

    # with open("graph.png", "wb") as f:
    #     f.write(png)

