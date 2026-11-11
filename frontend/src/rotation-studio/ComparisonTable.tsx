import { Card } from "@/components/ui/card"
import { scoreMeta } from "@/lib/scoreLabels"
import type { Strategy } from "@/types/api"

export default function ComparisonTable({ strategies }: { strategies: Strategy[] }) {
  return (
    <Card className="rounded-2xl p-5">
      <h2 className="mb-1 font-semibold">Side-by-side comparison</h2>
      <p className="mb-4 text-xs text-forest/60">The best value in each row is highlighted.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-forest/10 text-left">
              <th className="py-2 pr-4 font-medium text-forest/60">Dimension</th>
              {strategies.map((s) => (
                <th key={s.id} className="px-3 py-2 text-center font-semibold">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scoreMeta.map((m) => {
              const best = Math.max(...strategies.map((s) => s.scores[m.key]))
              return (
                <tr key={m.key} className="border-b border-forest/5">
                  <td className="py-2.5 pr-4">{m.label}</td>
                  {strategies.map((s) => {
                    const v = s.scores[m.key]
                    return (
                      <td
                        key={s.id}
                        className={`px-3 py-2.5 text-center ${
                          v === best ? "rounded-lg bg-sage/30 font-bold" : ""
                        }`}
                      >
                        {v}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr>
              <td className="py-3 pr-4 font-semibold">Overall fit</td>
              {strategies.map((s) => (
                <td key={s.id} className="px-3 py-3 text-center font-bold">
                  {s.overallScore}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}