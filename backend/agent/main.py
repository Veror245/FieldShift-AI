import pandas as pd
import uuid

from langgraph.graph import START, END, StateGraph
from ..agent.supervisor.state import InvestigationState, AgentName
from ..agent.supervisor.graph import supervisor_node, AGENT_NODES, route_from_supervisor
from ..agent.earth_obser.graph import earth_obs_node
from ..agent.soil.graph import soil_node
from ..agent.rotation.graph import rotation_node
from ..agent.advisor.graph import advisor_node

import asyncio

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
graph.add_node("soil", soil_node)
graph.add_node("climate", stub_climate)
graph.add_node("rotation", rotation_node)
graph.add_node("advisor", advisor_node)
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
        request = {
            "investigation_id": f"test-{uuid.uuid4().hex[:8]}",
            "farm_id": "farm-001",

            "lat": 22.57,
            "lon": 88.36,
            "region": "kolkata",

            "current_rotation": [
                {"crop_id": "rice",  "season": "kharif", "year": 2023},
                {"crop_id": "wheat", "season": "rabi",   "year": 2023},
            ],

            "soil_inputs": {
                "ph": 7.8,
                "organic_carbon_pct": 0.45,
                "texture": "loam",
                "nitrogen_ppm": 180,
                "sampled_at": "2024-03-15",
                "lab_name": "Punjab Soil Lab",
            },

            "objectives": "Water availability has become unreliable. I want to improve soil health without taking excessive economic risks.",

            "priorities": {
                "water_efficiency": 0.9,
                "soil_improvement": 0.8,
                "economic_potential": 0.5,
                "climate_compatibility": 0.7,
                "nitrogen_cycling": 0.6,
                "erosion_protection": 0.3,
                "crop_diversity": 0.4,
                "feasibility": 0.5,
            },

            "constraints": {
                "forbidden_crops": [],
                "required_crops": [],
                "max_water_requirement": "medium",
            },
        }

        async for event in app.astream(request, stream_mode="updates"): # type: ignore
            for node_name, delta in event.items():
                print(f"\n=== {node_name} ===")
                print(delta)
    
    asyncio.run(main())
   
    # png = app.get_graph().draw_mermaid_png()

    # with open("graph.png", "wb") as f:
    #     f.write(png)

df = pd.read_csv("backend/data/earth_obs/test-b311448d.csv", index_col=0)
print(df["precip_mm"].describe())
print(df["precip_mm"].sum())