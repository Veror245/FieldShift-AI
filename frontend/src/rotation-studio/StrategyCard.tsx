import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BadgeCheck, Check, Info, Lightbulb, Minus, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import RotationRadar from "@/charts/RotationRadar"
import type { Scores, Strategy } from "@/types/api"

const kindMeta: Record<Strategy["kind"], { label: string; color: string }> = {
  baseline: { label: "Baseline", color: "#5F7A6B" },
  soil: { label: "Soil restoration", color: "#1E3A2F" },
  climate: { label: "Climate resilience", color: "#2F6B57" },
  farmer: { label: "Farmer-prioritized", color: "#E08E45" },
}

function List({
  title,
  items,
  icon,
  tone = "",
}: {
  title: string
  items: string[]
  icon: ReactNode
  tone?: string
}) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-forest/50">{title}</p>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t} className={`flex gap-2 text-sm ${tone}`}>
            <span className="mt-0.5 shrink-0">{icon}</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

type Props = {
  strategy: Strategy
  baseline?: Strategy
  priorities?: Scores
  rank: number
  rankChange?: number
  total: number
  index: number
  selected: boolean
  onSelect: (s: Strategy) => void
  onExplain: (s: Strategy) => void
}

export default function StrategyCard({
  strategy: s,
  baseline,
  priorities,
  rank,
  rankChange,
  total,
  index,
  selected,
  onSelect,
  onExplain,
}: Props) {
  const meta = kindMeta[s.kind]
  const isBaseline = s.kind === "baseline"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="h-full"
    >
      <Card
        className={`flex h-full flex-col gap-5 rounded-2xl p-5 transition-shadow hover:shadow-lg ${
          selected ? "ring-2 ring-forest" : ""
        }`}
      >
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: meta.color }}
            >
              {meta.label}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-forest/60">
              Rank {rank} of {total}
              {rankChange !== undefined && rankChange !== 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 font-semibold ${
                    rankChange > 0 ? "bg-sage/30 text-forest" : "bg-sun/15 text-sun"
                  }`}
                >
                  {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
                </span>
              )}
            </span>
          </div>
          <h2 className="text-xl font-bold">{s.name}</h2>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-forest/70">Overall fit</span>
            <span className="font-bold">{s.overallScore}/100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-forest/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: meta.color }}
              initial={{ width: 0 }}
              animate={{ width: `${s.overallScore}%` }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.08 }}
            />
          </div>
          <p className="mt-1 text-xs text-forest/50">
            A relative comparison between these options, not a prediction of results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {s.sequence.map((c, i) => (
            <div key={`${c.season}-${i}`} className="flex items-center gap-1.5">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-full border border-forest/20 bg-ivory px-3 py-1.5 text-sm"
              >
                <span className="text-forest/50">{c.season} · </span>
                <span className="font-semibold">{c.crop}</span>
              </motion.span>
              {i < s.sequence.length - 1 && <ArrowRight className="h-4 w-4 text-forest/40" />}
            </div>
          ))}
        </div>

        <div>
          <RotationRadar
            scores={s.scores}
            baseline={isBaseline ? undefined : baseline?.scores}
            priorities={priorities}
            color={meta.color}
          />
          <p className="text-center text-xs text-forest/50">
            {!isBaseline && "Sage dashed = existing rotation · "}Orange dotted = your priorities
          </p>
        </div>

        <List title="Benefits" items={s.benefits} icon={<Check className="h-4 w-4 text-forest" />} />
        <List title="Trade-offs" items={s.drawbacks} icon={<Minus className="h-4 w-4 text-forest/60" />} />
        <List
          title="Flagged by the risk auditor"
          items={s.risks}
          icon={<ShieldAlert className="h-4 w-4 text-sun" />}
        />
        <List
          title="Missing data"
          items={s.missingData}
          icon={<Info className="h-4 w-4 text-forest/50" />}
          tone="text-forest/70"
        />

        {s.needsExpertValidation && (
          <div className="flex items-start gap-2 rounded-xl bg-sun/10 p-3 text-xs">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
            Needs validation by a local agricultural expert before any decision.
          </div>
        )}

        <div className="mt-auto space-y-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onExplain(s)}
            className="h-12 w-full rounded-xl"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Why this strategy?
          </Button>
          <Button
            onClick={() => onSelect(s)}
            variant={selected ? "secondary" : "default"}
            className="h-12 w-full rounded-xl"
            disabled={selected}
          >
            {selected ? "Selected for review" : "Select for review"}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}