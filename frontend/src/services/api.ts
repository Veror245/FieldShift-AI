import type {
  ClimateFindings,
  Strategy,
  StrategyExplanation,
} from "@/types/api"
import type { ScenarioInput, ScenarioResult } from "@/types/scenario"
import { mockStrategies } from "@/mocks/strategies"
import { mockClimate } from "@/mocks/climate"
import { mockExplanations } from "@/mocks/explanations"
import { defaultWeights, weightedScore, type Weights } from "@/lib/scoring"
import { runScenario } from "@/lib/scenario"

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false"
export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function getStrategies(): Promise<Strategy[]> {
  if (USE_MOCK) {
    await wait(800)
    return mockStrategies.map((s) => ({
      ...s,
      overallScore: weightedScore(s.scores, defaultWeights),
    }))
  }
  const res = await fetch(`${BASE_URL}/rotations/compare`, { method: "POST" })
  if (!res.ok) throw new Error("Failed to load strategies")
  return res.json()
}

export async function getClimateFindings(): Promise<ClimateFindings> {
  if (USE_MOCK) {
    await wait(700)
    return mockClimate
  }
  // Placeholder path: update it to match the backend teammate's endpoint
  const res = await fetch(`${BASE_URL}/climate/findings`)
  if (!res.ok) throw new Error("Failed to load climate findings")
  return res.json()
}

export async function reviseStrategies(weights: Weights): Promise<Strategy[]> {
  if (USE_MOCK) {
    await wait(900)
    return mockStrategies.map((s) => ({
      ...s,
      overallScore: weightedScore(s.scores, weights),
    }))
  }
  // Placeholder path: update it to match the backend teammate's endpoint
  const res = await fetch(`${BASE_URL}/rotations/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weights }),
  })
  if (!res.ok) throw new Error("Failed to revise strategies")
  return res.json()
}

export async function getExplanation(strategyId: string): Promise<StrategyExplanation> {
  if (USE_MOCK) {
    await wait(500)
    const found = mockExplanations[strategyId]
    if (!found) throw new Error("No explanation found")
    return found
  }
  // Placeholder path: update it to match the backend teammate's endpoint
  const res = await fetch(`${BASE_URL}/rotations/${strategyId}/explanation`)
  if (!res.ok) throw new Error("Failed to load explanation")
  return res.json()
}

export async function evaluateScenario(input: ScenarioInput): Promise<ScenarioResult> {
  if (USE_MOCK) {
    await wait(350)
    return runScenario(input)
  }
  const res = await fetch(`${BASE_URL}/scenarios/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to evaluate scenario")
  return res.json()
}