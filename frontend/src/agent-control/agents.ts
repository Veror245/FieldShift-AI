import {
  Brain,
  CloudRain,
  MessageSquareText,
  Route,
  Satellite,
  ShieldCheck,
  Sprout,
} from "lucide-react"
import type { AgentEvent } from "@/types/api"

export const agents: {
  id: AgentEvent["agent"]
  label: string
  role: string
  icon: typeof Brain
}[] = [
  { id: "supervisor", label: "Supervisor", role: "Plans and coordinates the investigation", icon: Brain },
  { id: "earth_observation", label: "Earth Observation", role: "Fetches NASA environmental data", icon: Satellite },
  { id: "climate", label: "Climate Intelligence", role: "Finds seasonal patterns and unusual seasons", icon: CloudRain },
  { id: "agronomy", label: "Soil & Agronomy", role: "Checks soil and crop compatibility", icon: Sprout },
  { id: "planner", label: "Rotation Planner", role: "Generates candidate rotations", icon: Route },
  { id: "auditor", label: "Risk Auditor", role: "Challenges every candidate", icon: ShieldCheck },
  { id: "advisor", label: "Farmer Advisor", role: "Explains results in plain language", icon: MessageSquareText },
]

export const agentLabel = (id: AgentEvent["agent"]) =>
  agents.find((a) => a.id === id)?.label ?? id