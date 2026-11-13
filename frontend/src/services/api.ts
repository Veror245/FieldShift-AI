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
import type { InvestigationRequest } from "@/lib/investigationRequest"

export const USE_MOCK = false
export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const jsonHeaders = { "Content-Type": "application/json" }

export async function getStrategies(weights: Weights = defaultWeights): Promise<Strategy[]> {
  await wait(400)
  return mockStrategies.map((s) => ({
    ...s,
    overallScore: weightedScore(s.scores, weights),
  }))
}

export async function getClimateFindings(): Promise<ClimateFindings> {
  await wait(350)
  return mockClimate
}

export async function getExplanation(strategyId: string): Promise<StrategyExplanation> {
  await wait(250)
  const found = mockExplanations[strategyId]
  if (!found) return mockExplanations["a"] ?? Object.values(mockExplanations)[0]
  return found
}

export async function evaluateScenario(
  input: ScenarioInput,
  weights: Weights = defaultWeights
): Promise<ScenarioResult> {
  await wait(200)
  return runScenario(input, weights)
}

export async function getSeasonalCalendar(): Promise<SeasonalCalendar> {
  await wait(300)
  return mockCalendar
}

export async function getWatchRules(): Promise<WatchRule[]> {
  await wait(200)
  return mockWatch.rules()
}

export async function createWatchRule(rule: NewWatchRule): Promise<WatchRule> {
  await wait(200)
  return mockWatch.addRule(rule)
}

export async function updateWatchRule(id: string, patch: Partial<NewWatchRule>): Promise<void> {
  await wait(150)
  mockWatch.updateRule(id, patch)
}

export async function deleteWatchRule(id: string): Promise<void> {
  await wait(150)
  mockWatch.removeRule(id)
}

export async function getWatchAlerts(): Promise<WatchAlert[]> {
  await wait(250)
  return mockWatch.alerts()
}

export async function reviewWatchAlert(id: string): Promise<void> {
  await wait(150)
  mockWatch.reviewAlert(id)
}

export async function startInvestigation(
  request: InvestigationRequest
): Promise<{ investigationId: string; data?: unknown }> {
  const fallbackId = "inv-" + Date.now().toString(36)
  try {
    // 60-second timeout to allow backend LLM/Gemini agents to run to completion
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)

    const res = await fetch(`${BASE_URL}/investigations`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(request),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      let detail = ""
      try {
        const errJson = await res.json()
        detail = errJson.detail
          ? typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail)
          : JSON.stringify(errJson)
      } catch {
        detail = await res.text().catch(() => "")
      }
      console.warn("Backend /investigations returned status", res.status, detail)
      return { investigationId: fallbackId }
    }

    const data = await res.json().catch(() => null)
    const id = data?.investigation_id ?? data?.id ?? data?.farm_id ?? fallbackId
    return { investigationId: String(id), data }
  } catch (err) {
    console.warn("Backend /investigations timed out or error occurred, using session ID:", err)
    return { investigationId: fallbackId }
  }
}