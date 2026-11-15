import {
  BrainIcon,
  CloudRainIcon,
  MessageSquareIcon,
  RouteIcon,
  SatelliteIcon,
  SproutIcon,
} from "@/components/common/Icons"
import type { AgentEvent } from "@/types/api"

export const agents: {
  id: AgentEvent["agent"]
  label: string
  role: string
  icon: typeof BrainIcon
}[] = [
  { id: "supervisor", label: "Supervisor", role: "Plans and coordinates the investigation", icon: BrainIcon },
  { id: "earth_observation", label: "Earth Observation", role: "Fetches NASA environmental data", icon: SatelliteIcon },
  { id: "climate", label: "Climate Intelligence", role: "Finds seasonal patterns and unusual seasons", icon: CloudRainIcon },
  { id: "agronomy", label: "Soil & Agronomy", role: "Checks soil and crop compatibility", icon: SproutIcon },
  { id: "planner", label: "Rotation Planner", role: "Generates and validates candidate rotations", icon: RouteIcon },
  { id: "advisor", label: "Farmer Advisor", role: "Explains results in plain language", icon: MessageSquareIcon },
]

export const agentLabel = (id: AgentEvent["agent"]) =>
  agents.find((a) => a.id === id)?.label ?? id
