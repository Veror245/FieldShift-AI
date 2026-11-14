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
import type { BackendInvestigationResult } from "@/types/investigation"
import { useFarmStore } from "@/store/useFarmStore"
import { sampleBackendInvestigationResult } from "@/mocks/mockInvestigationResult"

export const USE_MOCK = false
export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const jsonHeaders = { "Content-Type": "application/json" }

function mapBackendScores(raw: Record<string, number>): Strategy["scores"] {
  const norm = (v: number | undefined) => {
    if (v === undefined || isNaN(v)) return 50
    return v <= 1 ? Math.round(v * 100) : Math.round(v)
  }

  return {
    waterEfficiency: norm(raw.water_efficiency ?? raw.waterEfficiency),
    climateCompatibility: norm(raw.climate_compatibility ?? raw.climateCompatibility),
    soilImprovement: norm(raw.soil_improvement ?? raw.soilImprovement),
    nitrogenCycling: norm(raw.nitrogen_cycling ?? raw.nitrogenCycling),
    erosionProtection: norm(raw.erosion_protection ?? raw.erosionProtection),
    cropDiversity: norm(raw.crop_diversity ?? raw.cropDiversity),
    economicPotential: norm(raw.economic_potential ?? raw.economicPotential),
    feasibility: norm(raw.feasibility),
  }
}

function mapKind(label: string): Strategy["kind"] {
  const l = label.toLowerCase()
  if (l.includes("soil")) return "soil"
  if (l.includes("climate")) return "climate"
  if (l.includes("farmer") || l.includes("prioritized")) return "farmer"
  return "baseline"
}

function mapName(label: string, id: string): string {
  const l = label.toLowerCase()
  if (l.includes("existing") || id === "strategy_a" || id === "a") return "Current rotation baseline"
  if (l.includes("soil") || id === "strategy_b" || id === "b") return "Soil restoration"
  if (l.includes("climate") || id === "strategy_c" || id === "c") return "Climate resilience"
  if (l.includes("farmer") || id === "strategy_d" || id === "d") return "Farmer prioritized"
  return label.replace(/_/g, " ")
}

export async function getStrategies(weights: Weights = defaultWeights): Promise<Strategy[]> {
  await wait(100)
  const storeResult = useFarmStore.getState().investigationResult
  const backendStrats = storeResult?.rotation?.strategies

  if (backendStrats && Array.isArray(backendStrats) && backendStrats.length > 0) {
    return backendStrats.map((s: Record<string, unknown>, idx: number) => {
      const rawId = String(s.strategy_id ?? ["a", "b", "c", "d"][idx] ?? idx)
      const cleanId = rawId.replace(/^strategy_/, "").toLowerCase()
      const label = String(s.label ?? rawId)
      const rawScores = (s.scores || {}) as Record<string, number>
      const scores = mapBackendScores(rawScores)
      const overall = weightedScore(scores, weights)
      const seqArr = Array.isArray(s.sequence) ? s.sequence : []
      const sequence = seqArr.map((item: { crop_id?: string; crop?: string; season?: string }) => ({
        crop: item.crop ?? item.crop_id ?? "Cereal",
        season: item.season ?? "Kharif",
      }))

      const fallbackMock = mockStrategies.find((m) => m.id === cleanId || m.id === rawId) ?? mockStrategies[idx % mockStrategies.length]

      return {
        id: cleanId,
        name: mapName(label, cleanId),
        kind: mapKind(label),
        sequence: sequence.length > 0 ? sequence : fallbackMock.sequence,
        scores,
        overallScore: overall,
        benefits: Array.isArray(s.benefits) && s.benefits.length > 0 ? (s.benefits as string[]) : fallbackMock.benefits,
        drawbacks: Array.isArray(s.drawbacks) && s.drawbacks.length > 0 ? (s.drawbacks as string[]) : fallbackMock.drawbacks,
        risks: fallbackMock.risks,
        missingData: Array.isArray(s.assumptions) && s.assumptions.length > 0 ? (s.assumptions as string[]) : fallbackMock.missingData,
        needsExpertValidation: fallbackMock.needsExpertValidation,
      }
    })
  }

  return mockStrategies.map((s) => ({
    ...s,
    overallScore: weightedScore(s.scores, weights),
  }))
}

export async function getClimateFindings(): Promise<ClimateFindings> {
  await wait(100)
  const storeResult = useFarmStore.getState().investigationResult
  if (storeResult?.climate && typeof storeResult.climate === "object") {
    const cl = storeResult.climate as Partial<ClimateFindings>
    if (cl.seasons && Array.isArray(cl.seasons) && cl.seasons.length > 0) {
      return {
        ...mockClimate,
        ...cl,
      } as ClimateFindings
    }
  }
  return mockClimate
}

export async function getExplanation(strategyId: string): Promise<StrategyExplanation> {
  await wait(100)
  const normId = strategyId.replace(/^strategy_/, "").toLowerCase()
  const found = mockExplanations[normId] ?? mockExplanations[strategyId] ?? mockExplanations.a
  const storeResult = useFarmStore.getState().investigationResult
  const advisor = storeResult?.advisor

  if (advisor && advisor.overview) {
    return {
      ...found,
      strategyId,
      why: {
        text: advisor.overview,
        evidenceIds: found.why.evidenceIds,
      },
    }
  }

  return found
}

export async function evaluateScenario(
  input: ScenarioInput,
  weights: Weights = defaultWeights
): Promise<ScenarioResult> {
  await wait(150)
  return runScenario(input, weights)
}

export async function getSeasonalCalendar(): Promise<SeasonalCalendar> {
  await wait(150)
  return mockCalendar
}

export async function getWatchRules(): Promise<WatchRule[]> {
  await wait(100)
  return mockWatch.rules()
}

export async function createWatchRule(rule: NewWatchRule): Promise<WatchRule> {
  await wait(150)
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
  await wait(150)
  return mockWatch.alerts()
}

export async function reviewWatchAlert(id: string): Promise<void> {
  await wait(150)
  mockWatch.reviewAlert(id)
}

export async function startInvestigation(
  request: InvestigationRequest
): Promise<{ investigationId: string; result?: BackendInvestigationResult }> {
  try {
    const res = await fetch(`${BASE_URL}/investigations`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(request),
    })
    if (res.ok) {
      const data = await res.json()
      const investigationId = String(data.investigation_id ?? data.id ?? "investigation-001")
      const resultObj = (data.advisor || data.rotation ? data : sampleBackendInvestigationResult) as BackendInvestigationResult
      useFarmStore.getState().setInvestigationId(investigationId)
      useFarmStore.getState().setInvestigationResult(resultObj)
      return { investigationId, result: resultObj }
    }
  } catch (e) {
    console.warn("Backend investigation unavailable, using local farm context.", e)
  }

  useFarmStore.getState().setInvestigationId("demo")
  useFarmStore.getState().setInvestigationResult(sampleBackendInvestigationResult)
  return { investigationId: "demo", result: sampleBackendInvestigationResult }
}
