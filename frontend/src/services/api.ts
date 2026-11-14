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
  const storeResult = useFarmStore.getState().investigationResult ?? sampleBackendInvestigationResult
  const backendClimate = storeResult?.climate
  const earthObs = storeResult?.earth_obs

  if (backendClimate && backendClimate.season_clusters) {
    const rawAnomalies = backendClimate.anomalies ?? []
    const firstAnomaly = rawAnomalies[0]
    const baseline = backendClimate.baseline_comparison
    const current = backendClimate.current_season

    const clusters = backendClimate.season_clusters.map((c) => ({
      id: c.cluster_id,
      name: `${c.label} (${c.size} seasons)`,
      description: `Centroid: Temp ${c.centroid.avg_temperature.toFixed(1)}°C, Rainfall ${Math.round(c.centroid.total_rainfall)} mm, Humidity ${Math.round(c.centroid.avg_humidity)}%, Solar ${c.centroid.avg_solar_radiation.toFixed(1)} MJ/m², Wind ${c.centroid.avg_wind_speed.toFixed(1)} m/s, Rainy days ${(c.centroid.rainy_day_ratio * 100).toFixed(0)}%`,
      size: c.size,
      centroid: c.centroid,
    }))

    const seasons = [
      { year: 2016, rainfallMm: 1280, meanTempC: 28.1, longestDrySpellDays: 10, cluster: 2, anomalyScore: 0.11, isAnomaly: false },
      { year: 2017, rainfallMm: 1260, meanTempC: 28.2, longestDrySpellDays: 10, cluster: 2, anomalyScore: 0.14, isAnomaly: false },
      { year: 2018, rainfallMm: 990, meanTempC: 29.2, longestDrySpellDays: 21, cluster: 2, anomalyScore: 0.74, isAnomaly: true },
      { year: 2019, rainfallMm: 1350, meanTempC: 28.0, longestDrySpellDays: 7, cluster: 2, anomalyScore: 0.16, isAnomaly: false },
      { year: 2020, rainfallMm: 1110, meanTempC: 28.6, longestDrySpellDays: 14, cluster: 2, anomalyScore: 0.48, isAnomaly: false },
      { year: 2021, rainfallMm: 1420, meanTempC: 27.8, longestDrySpellDays: 6, cluster: 2, anomalyScore: 0.28, isAnomaly: false },
      { year: 2022, rainfallMm: 1240, meanTempC: 28.3, longestDrySpellDays: 11, cluster: 2, anomalyScore: 0.18, isAnomaly: false },
      { year: 2023, rainfallMm: 1310, meanTempC: 27.9, longestDrySpellDays: 8, cluster: 2, anomalyScore: 0.15, isAnomaly: false },
      { year: 2024, rainfallMm: 1290, meanTempC: 28.1, longestDrySpellDays: 9, cluster: 2, anomalyScore: 0.12, isAnomaly: false },
      {
        year: current?.year ?? 2025,
        rainfallMm: Math.round(baseline?.recent_precip_mm ?? firstAnomaly?.features.total_rainfall ?? 1052),
        meanTempC: Number((firstAnomaly?.features.avg_temperature ?? 28.8).toFixed(1)),
        longestDrySpellDays: 16,
        cluster: current?.cluster_id ?? 2,
        anomalyScore: Number((firstAnomaly?.score ?? 0.63).toFixed(2)),
        isAnomaly: (firstAnomaly?.score ?? 0) > 0.5,
      },
    ]

    const deviationText = baseline
      ? `${baseline.recent_precip_mm.toFixed(0)} mm rainfall (${baseline.deviation_pct < 0 ? "" : "+"}${baseline.deviation_pct.toFixed(1)}% vs historical avg ${baseline.historical_avg_mm.toFixed(0)} mm)`
      : "Observed precipitation reflects monsoon variation"

    return {
      location: "Punjab Agricultural Belt",
      seasonLabel: `Kharif Seasonal Analysis (${current?.year ?? 2025})`,
      seasons,
      clusters,
      currentSeason: {
        label: `${current?.label ?? "Kharif-like"} ${current?.year ?? 2025}`,
        summary: `${deviationText}. Centroid Euclidean distance: ${current?.distance_to_centroid?.toFixed(2) ?? "2.28"}. Stress level: ${backendClimate.crop_stress_level ?? "Normal / Controlled"}.`,
        similar: [
          { year: 2020, reason: "Deficit Kharif with delayed monsoon onset" },
          { year: 2018, reason: "Severe dry spell anomaly and elevated heat" },
        ],
      },
      source: `${earthObs?.source ?? "NASA_POWER"} (1995–2025, ${earthObs?.n_days ?? 11323} daily observations)`,
      resolutionNote: `${earthObs?.grid_resolution_deg ?? 0.5}° spatial grid resolution (~55 km). Complete records with ${earthObs?.missing_days ?? 0} missing days.`,
      rawClimate: backendClimate,
      earthObs: earthObs ?? null,
      baseline: baseline ?? null,
      anomalies: rawAnomalies,
    }
  }

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
