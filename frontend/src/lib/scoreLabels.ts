import type { Scores } from "@/types/api"

export type ScoreMetric = {
  key: keyof Scores
  label: string
  short: string
}

export const scoreMeta: ScoreMetric[] = [
  { key: "waterEfficiency", label: "Water efficiency", short: "Water" },
  { key: "climateCompatibility", label: "Climate match", short: "Climate" },
  { key: "soilImprovement", label: "Soil improvement", short: "Soil" },
  { key: "nitrogenCycling", label: "Nitrogen cycling", short: "Nitrogen" },
  { key: "erosionProtection", label: "Erosion protection", short: "Erosion" },
  { key: "cropDiversity", label: "Crop diversity", short: "Diversity" },
  { key: "economicPotential", label: "Economic potential", short: "Economics" },
  { key: "feasibility", label: "Feasibility", short: "Feasibility" },
]
