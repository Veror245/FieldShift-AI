import type { ScenarioInput, ScenarioResult, ScenarioStrategyResult } from "@/types/scenario"
import { mockStrategies } from "@/mocks/strategies"

export const baselineScenario: ScenarioInput = {
  rainfallDeficitPct: 15,
  tempRiseC: 1.0,
  extraDrySpellDays: 5,
  variabilityPct: 20,
}

export function runScenario(input: ScenarioInput): ScenarioResult {
  const stress =
    (input.rainfallDeficitPct / 40) * 0.4 +
    (input.tempRiseC / 3) * 0.3 +
    (input.extraDrySpellDays / 15) * 0.3

  const results: ScenarioStrategyResult[] = mockStrategies.map((s, i) => {
    const climatePenalty = Math.round(stress * (s.kind === "climate" ? 10 : 25))
    const waterPenalty = Math.round(stress * (s.kind === "soil" ? 12 : 28))

    const newScores = {
      ...s.scores,
      climateCompatibility: Math.max(10, s.scores.climateCompatibility - climatePenalty),
      waterEfficiency: Math.max(10, s.scores.waterEfficiency - waterPenalty),
      economicPotential: Math.max(10, s.scores.economicPotential - Math.round(stress * 15)),
    }

    const baselineOverall = s.overallScore
    const overallScore = Math.max(
      10,
      Math.round(
        baselineOverall -
          stress * (s.kind === "climate" ? 12 : s.kind === "soil" ? 18 : 28)
      )
    )

    return {
      strategyId: s.id,
      name: s.name,
      kind: s.kind,
      scores: newScores,
      baselineScores: s.scores,
      overallScore,
      baselineOverall,
      rank: 1,
      baselineRank: i + 1,
    }
  })

  results.sort((a, b) => b.overallScore - a.overallScore)
  results.forEach((r, idx) => {
    r.rank = idx + 1
  })

  return { input, results }
}
