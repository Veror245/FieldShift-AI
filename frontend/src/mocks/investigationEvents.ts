import type { AgentEvent } from "@/types/api"

export type MockStep = { delay: number; event: Omit<AgentEvent, "timestamp"> }

let n = 0
const step = (
  delay: number,
  agent: AgentEvent["agent"],
  status: AgentEvent["status"],
  message: string,
  source?: string
): MockStep => ({ delay, event: { id: `demo-${++n}`, agent, status, message, source } })

export const mockEvents: MockStep[] = [
  step(500, "supervisor", "started", "Investigation started. Reading your field and priorities."),
  step(900, "supervisor", "running", "Plan ready: weather, climate and soil checks run in parallel."),
  step(700, "earth_observation", "started", "Requesting historical daily weather for the field location.", "NASA POWER"),
  step(400, "agronomy", "started", "Reading soil inputs and the crop knowledge base.", "Farmer input"),
  step(1100, "earth_observation", "running", "Downloading daily rainfall and temperature records.", "NASA POWER"),
  step(900, "agronomy", "completed", "Soil inputs checked. Missing values are kept as unknown."),
  step(1200, "earth_observation", "completed", "Weather records prepared with source and resolution details.", "NASA POWER"),
  step(600, "climate", "started", "Building seasonal features from the weather records."),
  step(1200, "climate", "running", "Grouping seasons into climate types.", "KMeans"),
  step(1200, "climate", "running", "Checking for unusual seasons.", "Isolation Forest"),
  step(1000, "climate", "completed", "Climate pattern summary ready."),
  step(800, "planner", "started", "Generating candidate rotations from evidence and priorities."),
  step(1300, "planner", "completed", "Candidate rotations validated against hard constraints."),
  step(900, "planner", "running", "Water-demand risk resolved in one candidate. Final check passed."),
  step(700, "advisor", "started", "Preparing plain-language explanations."),
  step(1200, "advisor", "completed", "Comparison ready for your review."),
  step(600, "supervisor", "completed", "Investigation complete. Waiting for your review."),
]