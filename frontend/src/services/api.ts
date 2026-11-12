import type { ClimateFindings, Strategy, StrategyExplanation } from "@/types/api"
import type { ScenarioInput, ScenarioResult } from "@/types/scenario"
import type { SeasonalCalendar } from "@/types/calendar"
import type { NewWatchRule, WatchAlert, WatchRule } from "@/types/watch"
import { mockStrategies } from "@/mocks/strategies"
import { mockClimate } from "@/mocks/climate"
import { mockExplanations } from "@/mocks/explanations"
import { mockCalendar } from "@/mocks/calendar"
import { mockWatch } from "@/mocks/watch"
import { defaultWeights, weightedScore, type Weights } from "@/lib/scoring"
import { runScenario } from "@/lib/scenario"
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false"
export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const jsonHeaders = { "Content-Type": "application/json" }
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
  const res = await fetch(`${BASE_URL}/rotations/generate`, {
    method: "POST",
    headers: jsonHeaders,
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
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to evaluate scenario")
  return res.json()
}
export async function getSeasonalCalendar(): Promise<SeasonalCalendar> {
  if (USE_MOCK) {
    await wait(600)
    return mockCalendar
  }
  const res = await fetch(`${BASE_URL}/calendar`)
  if (!res.ok) throw new Error("Failed to load the seasonal calendar")
  return res.json()
}
export async function getWatchRules(): Promise<WatchRule[]> {
  if (USE_MOCK) {
    await wait(400)
    return mockWatch.rules()
  }
  const res = await fetch(`${BASE_URL}/monitoring/rules`)
  if (!res.ok) throw new Error("Failed to load monitoring rules")
  return res.json()
}
export async function createWatchRule(rule: NewWatchRule): Promise<WatchRule> {
  if (USE_MOCK) {
    await wait(400)
    return mockWatch.addRule(rule)
  }
  const res = await fetch(`${BASE_URL}/monitoring/rules`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(rule),
  })
  if (!res.ok) throw new Error("Failed to create the rule")
  return res.json()
}
export async function updateWatchRule(id: string, patch: Partial<NewWatchRule>): Promise<void> {
  if (USE_MOCK) {
    await wait(250)
    mockWatch.updateRule(id, patch)
    return
  }
  const res = await fetch(`${BASE_URL}/monitoring/rules/${id}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error("Failed to update the rule")
}
export async function deleteWatchRule(id: string): Promise<void> {
  if (USE_MOCK) {
    await wait(250)
    mockWatch.removeRule(id)
    return
  }
  const res = await fetch(`${BASE_URL}/monitoring/rules/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete the rule")
}
export async function getWatchAlerts(): Promise<WatchAlert[]> {
  if (USE_MOCK) {
    await wait(500)
    return mockWatch.alerts()
  }
  const res = await fetch(`${BASE_URL}/alerts`)
  if (!res.ok) throw new Error("Failed to load alerts")
  return res.json()
}
export async function reviewWatchAlert(id: string): Promise<void> {
  if (USE_MOCK) {
    await wait(250)
    mockWatch.reviewAlert(id)
    return
  }
  const res = await fetch(`${BASE_URL}/alerts/${id}/review`, { method: "POST" })
  if (!res.ok) throw new Error("Failed to update the alert")
}
