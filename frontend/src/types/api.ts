export type CropSeason = { season: string; crop: string }

export type Scores = {
  waterEfficiency: number // every score is 0 to 100
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
  anomalyScore: number // 0 to 1, higher = more unusual
  isAnomaly: boolean
}

export type ClimateCluster = { id: number; name: string; description: string }

export type SimilarSeason = { year: number; reason: string }

export type ClimateFindings = {
  location: string
  seasonLabel: string
  seasons: ClimateSeason[]
  clusters: ClimateCluster[]
  currentSeason: { label: string; summary: string; similar: SimilarSeason[] }
  source: string
  resolutionNote: string
}