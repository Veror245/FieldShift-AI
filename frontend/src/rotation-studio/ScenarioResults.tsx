import { motion } from "framer-motion"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { Card } from "@/components/ui/card"
import RotationRadar from "@/charts/RotationRadar"
import { scoreMeta } from "@/lib/scoreLabels"
import type { Strategy } from "@/types/api"
import type { ScenarioResult, ScenarioStrategyResult } from "@/types/scenario"

const colors: Record<Strategy["kind"], string> = {
  baseline: "#5F7A6B",
  soil: "#1E3A2F",
  climate: "#2F6B57",
  farmer: "#E08E45",
}

function changesOf(r: ScenarioStrategyResult) {
  return scoreMeta
    .map((m) => ({
      label: m.label,
      delta: r.scores[m.key] - r.baselineScores[m.key],
    }))
    .filter((c) => c.delta !== 0)
    .sort((a, b) => a.delta - b.delta)
}

function chipStyle(delta: number) {
  if (delta <= -15) return "bg-red-600/10 text-red-700"
  if (delta <= -8) return "bg-sun/15 text-sun"
  return "bg-forest/10 text-forest/70"
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-forest/50">no change</span>
  return (
    <span className={value < 0 ? "font-semibold text-sun" : "font-semibold text-forest"}>
      {value > 0 ? `+${value}` : value}
    </span>
  )
}

export default function ScenarioResults({ result }: { result: ScenarioResult }) {
  const rows = result.results
  const top = rows[0]
  const originalTop = rows.find((r) => r.baselineRank === 1)
  const changed = top && originalTop && top.strategyId !== originalTop.strategyId

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl border-sage bg-white p-5">
        <p className="text-sm">
          {changed ? (
            <>
              Under this scenario the ranking shifts: <strong>{top.name}</strong> moves to first
              place, ahead of <strong>{originalTop.name}</strong>.
            </>
          ) : (
            <>
              The top-ranked option stays the same under this scenario: <strong>{top?.name}</strong>.
            </>
          )}
        </p>
      </Card>

      <motion.ol layout className="space-y-3">
        {rows.map((r) => {
          const shift = r.baselineRank - r.rank
          const changes = changesOf(r)
          const exposed = changes.filter((c) => c.delta <= -8)
          return (
            <motion.li
              key={r.strategyId}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Card className="rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest text-lg font-bold text-ivory">
                    {r.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{r.name}</h3>
                      <span className="flex items-center gap-1 text-xs text-forest/60">
                        {shift > 0 && <ArrowUp className="h-3.5 w-3.5 text-forest" />}
                        {shift < 0 && <ArrowDown className="h-3.5 w-3.5 text-sun" />}
                        {shift === 0 && <Minus className="h-3.5 w-3.5" />}
                        {shift === 0 ? "same rank as baseline" : `${Math.abs(shift)} place${Math.abs(shift) > 1 ? "s" : ""} vs baseline`}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors[r.kind] }}
                        animate={{ width: `${r.overallScore}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{r.overallScore}</p>
                    <p className="text-xs text-forest/60">
                      was {r.baselineOverall} · <Delta value={r.overallScore - r.baselineOverall} />
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-ivory p-3">
                    <p className="text-xs text-forest/60">Water suitability</p>
                    <p className="font-semibold">
                      {r.baselineScores.waterEfficiency} → {r.scores.waterEfficiency}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ivory p-3">
                    <p className="text-xs text-forest/60">Climate compatibility</p>
                    <p className="font-semibold">
                      {r.baselineScores.climateCompatibility} → {r.scores.climateCompatibility}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-forest/50">
                    {exposed.length > 0 ? "Weaknesses exposed" : "Objectives that changed"}
                  </p>
                  {changes.length === 0 ? (
                    <p className="text-sm text-forest/60">No objectives changed under this scenario.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {changes.map((c) => (
                        <span
                          key={c.label}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${chipStyle(c.delta)}`}
                        >
                          {c.label} {c.delta}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.li>
          )
        })}
      </motion.ol>

      <div>
        <h2 className="mb-1 font-semibold">Shape under stress</h2>
        <p className="mb-3 text-xs text-forest/60">
          Solid = under this scenario. Dashed = historical conditions.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.strategyId} className="rounded-2xl p-4">
              <p className="mb-1 text-center text-sm font-semibold">{r.name}</p>
              <RotationRadar scores={r.scores} baseline={r.baselineScores} color={colors[r.kind]} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}