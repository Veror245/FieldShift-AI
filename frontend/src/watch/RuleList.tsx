import { motion } from "framer-motion"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { metricMeta } from "@/lib/watchMeta"
import type { WatchRule } from "@/types/watch"

type Props = {
  rules: WatchRule[]
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
}

export default function RuleList({ rules, onToggle, onDelete }: Props) {
  return (
    <Card className="rounded-2xl p-5">
      <h2 className="mb-4 font-semibold">Your monitoring rules</h2>

      {rules.length === 0 ? (
        <p className="text-sm text-forest/60">
          No rules yet. Add one above and we will keep an eye on it for you.
        </p>
      ) : (
        <ul className="space-y-3">
          {rules.map((r, i) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`flex items-start gap-3 rounded-xl border border-forest/10 p-3 ${
                r.enabled ? "bg-white" : "bg-forest/5"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="mt-0.5 text-xs text-forest/70">
                  {metricMeta[r.metric].describe(r.threshold, r.windowDays)}
                </p>
              </div>
              <Switch
                checked={r.enabled}
                onCheckedChange={(v) => onToggle(r.id, v)}
                aria-label={`Turn ${r.name} on or off`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(r.id)}
                aria-label={`Delete ${r.name}`}
                className="h-9 w-9 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  )
}