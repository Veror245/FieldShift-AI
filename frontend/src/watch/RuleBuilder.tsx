import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { metricMeta, metricOrder } from "@/lib/watchMeta"
import type { NewWatchRule, WatchMetric } from "@/types/watch"

const inputClass =
  "h-11 w-full rounded-xl border border-forest/15 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sage"

type Props = { onCreate: (rule: NewWatchRule) => void; creating: boolean }

export default function RuleBuilder({ onCreate, creating }: Props) {
  const [metric, setMetric] = useState<WatchMetric>("rainfall")
  const [threshold, setThreshold] = useState(metricMeta.rainfall.defaultThreshold)
  const [windowDays, setWindowDays] = useState(metricMeta.rainfall.defaultWindow)
  const [name, setName] = useState("")
  const meta = metricMeta[metric]

  const changeMetric = (m: WatchMetric) => {
    setMetric(m)
    setThreshold(metricMeta[m].defaultThreshold)
    setWindowDays(metricMeta[m].defaultWindow)
  }

  const submit = () => {
    onCreate({
      name: name.trim() || meta.label,
      metric,
      threshold,
      windowDays,
      enabled: true,
    })
    setName("")
  }

  return (
    <Card className="rounded-2xl p-5">
      <h2 className="mb-4 font-semibold">Add a monitoring rule</h2>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">What should we watch?</label>
          <select
            value={metric}
            onChange={(e) => changeMetric(e.target.value as WatchMetric)}
            className={inputClass}
          >
            {metricOrder.map((m) => (
              <option key={m} value={m}>
                {metricMeta[m].label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{meta.thresholdLabel}</span>
            <span className="font-semibold">{meta.formatThreshold(threshold)}</span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={(v) => setThreshold(v[0])}
            min={meta.min}
            max={meta.max}
            step={meta.step}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Time window</span>
            <span className="font-semibold">{windowDays} days</span>
          </div>
          <Slider
            value={[windowDays]}
            onValueChange={(v) => setWindowDays(v[0])}
            min={meta.windowMin}
            max={meta.windowMax}
            step={1}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Rule name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={meta.label}
            className={inputClass}
          />
        </div>

        <div className="rounded-xl bg-ivory p-3 text-sm">{meta.describe(threshold, windowDays)}</div>

        <Button onClick={submit} disabled={creating} className="h-12 w-full rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Adding…" : "Add rule"}
        </Button>
      </div>
    </Card>
  )
}