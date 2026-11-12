import type { Scores, Strategy } from "@/types/api"

export type ScenarioInput = {
  rainfallDeficitPct: number
  tempRiseC: number
  extraDrySpellDays: number
  variabilityPct: number
}

export type ScenarioStrategyResult = {
  strategyId: string
  name: string
  kind: Strategy["kind"]
  scores: Scores
  baselineScores: Scores
  overallScore: number
  baselineOverall: number
  rank: number
  baselineRank: number
}

export type ScenarioResult = {
  input: ScenarioInput
  results: ScenarioStrategyResult[]
}