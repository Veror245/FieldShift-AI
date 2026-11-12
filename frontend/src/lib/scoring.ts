import type { Scores } from "@/types/api"

export type Weights = {
  water: number
  soil: number
  climate: number
  profit: number
  effort: number
}

export const defaultWeights: Weights = {
  water: 50,
  soil: 50,
  climate: 50,
  profit: 50,
  effort: 50,
}

export const weightMeta: { key: keyof Weights; label: string; hint: string }[] = [
  { key: "water", label: "Water conservation", hint: "Prioritize low water demand & drought buffer" },
  { key: "soil", label: "Soil regeneration", hint: "Prioritize organic matter & nitrogen fixing" },
  { key: "climate", label: "Climate resilience", hint: "Prioritize heat tolerance & dry spell resilience" },
  { key: "profit", label: "Economic return", hint: "Prioritize cash crops & harvest margin" },
  { key: "effort", label: "Operational ease", hint: "Prioritize manageable labor & familiar seeds" },
]

export function weightedScore(scores: Scores, weights: Weights): number {
  const wWater = weights.water / 50
  const wSoil = weights.soil / 50
  const wClimate = weights.climate / 50
  const wProfit = weights.profit / 50
  const wEffort = weights.effort / 50

  const total = wWater + wSoil * 2 + wClimate + wProfit + wEffort
  if (total === 0) return 50

  const sum =
    scores.waterEfficiency * wWater +
    scores.soilImprovement * wSoil +
    scores.nitrogenCycling * wSoil +
    scores.climateCompatibility * wClimate +
    scores.economicPotential * wProfit +
    scores.feasibility * wEffort

  return Math.round(sum / total)
}

export function weightsToScores(weights: Weights): Scores {
  return {
    waterEfficiency: weights.water,
    climateCompatibility: weights.climate,
    soilImprovement: weights.soil,
    nitrogenCycling: weights.soil,
    erosionProtection: weights.soil,
    cropDiversity: Math.round((weights.soil + weights.climate) / 2),
    economicPotential: weights.profit,
    feasibility: weights.effort,
  }
}
