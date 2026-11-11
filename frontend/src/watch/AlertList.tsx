import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { BellRing, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AlertSeverity, WatchAlert } from "@/types/watch"

const severityStyle: Record<AlertSeverity, { label: string; className: string }> = {
  info: { label: "For your information", className: "bg-forest/10 text-forest" },
  watch: { label: "Worth watching", className: "bg-sage/40 text-forest" },
  attention: { label: "Needs attention", className: "bg-sun/20 text-sun" },
}

type Props = { alerts: WatchAlert[]; onReview: (id: string) => void }

export default function AlertList({ alerts, onReview }: Props) {
  if (alerts.length === 0) {
    return (
      <Card className="rounded-2xl p-8 text-center">
        <BellRing className="mx-auto mb-3 h-8 w-8 text-forest/30" />
        <p className="text-sm text-forest/70">
          No alerts yet. When a rule is triggered, the evidence is checked against the historical
          baseline and a short note appears here.
        </p>
      </Card>
    )
  }

  return (
    <ul className="space-y-4">
      {alerts.map((a, i) => {
        const sev = severityStyle[a.severity]
        return (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={`rounded-2xl p-5 ${a.status === "new" ? "" : "opacity-75"}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sev.className}`}>
                  {sev.label}
                </span>
                {a.status === "new" && (
                  <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] font-semibold text-ivory">
                    New
                  </span>
                )}
                <span className="ml-auto text-xs text-forest/60">
                  {new Date(a.date).toLocaleDateString([], {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h3 className="font-semibold">{a.title}</h3>
              <p className="mt-1 text-xs text-forest/60">Rule: {a.ruleName}</p>
              <p className="mt-3 text-sm leading-relaxed">{a.summary}</p>
              <p className="mt-3 rounded-lg bg-ivory p-2.5 text-xs text-forest/70">{a.dataNote}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {a.status === "new" && (
                  <Button
                    variant="secondary"
                    onClick={() => onReview(a.id)}
                    className="h-10 rounded-xl"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as reviewed
                  </Button>
                )}
                <Button asChild variant="outline" className="h-10 rounded-xl">
                  <Link to="/investigation">Investigate this</Link>
                </Button>
              </div>
            </Card>
          </motion.li>
        )
      })}
    </ul>
  )
}