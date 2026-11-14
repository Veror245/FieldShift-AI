import type {
  BackendClimateAnomaly,
  BackendBaselineComparison,
  BackendClimateData,
  BackendEarthObs,
} from "./investigation"

export type CropSeason = { season: string; crop: string }

export type Scores = {
  waterEfficiency: number
  climateCompatibility: number
  soilImprovement: number
  nitrogenCycling: number
  erosionProtection: number
  cropDiversity: number
  economicPotential: number
  feasibility: number
}

export type Strategy = {
  id: string
  name: string
  kind: "baseline" | "soil" | "climate" | "farmer"
  sequence: CropSeason[]
  scores: Scores
  overallScore: number
  benefits: string[]
  drawbacks: string[]
  risks: string[]
  missingData: string[]
  needsExpertValidation: boolean
}

export type AgentEvent = {
  id: string
  agent:
    | "supervisor"
    | "earth_observation"
    | "climate"
    | "agronomy"
    | "planner"
    | "auditor"
    | "advisor"
  status: "started" | "running" | "completed" | "warning"
  message: string
  source?: string
  timestamp: string
}

export type ClimateSeason = {
  year: number
  rainfallMm: number
  meanTempC: number
  longestDrySpellDays: number
  cluster: number
  anomalyScore: number
  isAnomaly: boolean
}

export type ClimateCluster = {
  id: number
  name: string
  description: string
  size?: number
  centroid?: {
    avg_temperature: number
    total_rainfall: number
    rainfall_std: number
    avg_solar_radiation: number
    avg_humidity: number
    avg_wind_speed: number
    rainy_day_ratio: number
  }
}

export type SimilarSeason = { year: number; reason: string }

export type CurrentSeasonSummary = {
  label: string
  summary: string
  similar: SimilarSeason[]
}

export type ClimateFindings = {
  location: string
  seasonLabel: string
  seasons: ClimateSeason[]
  clusters: ClimateCluster[]
  currentSeason: CurrentSeasonSummary
  source: string
  resolutionNote: string
  rawClimate?: BackendClimateData | null
  earthObs?: BackendEarthObs | null
  baseline?: BackendBaselineComparison | null
  anomalies?: BackendClimateAnomaly[] | null
}

export type EvidenceKind = "observation" | "derived" | "ml" | "agronomy" | "farmer" | "llm"

export type EvidenceRecord = {
  id: string
  kind: EvidenceKind
  title: string
  dataset: string
  date: string
  resolution: string
  note?: string
}

export type Cited = { text: string; evidenceIds: string[] }

export type Level = "high" | "medium" | "low"

export type StrategyExplanation = {
  strategyId: string
  why: Cited
  observations: Cited
  soil: Cited
  crops: Cited
  confidence: { completeness: Level; recency: Level; resolution: Level; note: string }
  limitations: string[]
  evidence: EvidenceRecord[]
}
