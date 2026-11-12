import { mockStrategies } from "@/mocks/strategies"
import { defaultWeights, weightedScore, type Weights } from "@/lib/scoring"
import type { Scores } from "@/types/api"
import type { ScenarioInput, ScenarioResult } from "@/types/scenario"

export const baselineScenario: ScenarioInput = {
  rainfallDeficitPct: 0,
  tempRiseC: 0,
  extraDrySpellDays: 0,
  variabilityPct: 0,
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

// DEMO ONLY. A simple placeholder calculation to preview the interaction.
// The real stress test will run on the backend (POST /scenarios/evaluate).
function stress(scores: Scores, hasFallow: boolean, input: ScenarioInput): Scores {
  const rain = input.rainfallDeficitPct / 40
  const heat = input.tempRiseC / 3
  const dry = input.extraDrySpellDays / 15
  const vari = input.variabilityPct / 50
  const waterVuln = 0.4 + (100 - scores.waterEfficiency) / 100
  const heatVuln = 0.4 + (100 - scores.climateCompatibility) / 100

  return {
    ...scores,
    waterEfficiency: clamp(scores.waterEfficiency - 22 * rain * waterVuln - 14 * dry * waterVuln),
    climateCompatibility: clamp(
      scores.climateCompatibility - 20 * heat * heatVuln - 10 * vari * heatVuln - 8 * rain * heatVuln
    ),
    soilImprovement: clamp(scores.soilImprovement - 6 * rain),
    nitrogenCycling: clamp(scores.nitrogenCycling - 4 * rain),
    erosionProtection: clamp(scores.erosionProtection - 10 * dry * (hasFallow ? 1.6 : 0.5)),
  }
}

export function runScenario(input: ScenarioInput, weights: Weights = defaultWeights): ScenarioResult {
  const rows = mockStrategies.map((s) => {
    const hasFallow = s.sequence.some((c) => c.crop === "Fallow")
    const stressed = stress(s.scores, hasFallow, input)
    return {
      strategyId: s.id,
      name: s.name,
      kind: s.kind,
      baselineScores: s.scores,
      scores: stressed,
      baselineOverall: weightedScore(s.scores, weights),
      overallScore: weightedScore(stressed, weights),
    }
  })

  const rankBy = (key: "overallScore" | "baselineOverall") => {
    const sorted = [...rows].sort((a, b) => b[key] - a[key])
    return Object.fromEntries(sorted.map((r, i) => [r.strategyId, i + 1])) as Record<string, number>
  }
  const now = rankBy("overallScore")
  const before = rankBy("baselineOverall")

  return {
    input,
    results: rows
      .map((r) => ({ ...r, rank: now[r.strategyId], baselineRank: before[r.strategyId] }))
      .sort((a, b) => a.rank - b.rank),
  }
}