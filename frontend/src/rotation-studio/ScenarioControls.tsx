import { Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { baselineScenario } from "@/lib/scenario"
import type { ScenarioInput } from "@/types/scenario"

const controls: {
  key: keyof ScenarioInput
  label: string
  hint: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}[] = [
  {
    key: "rainfallDeficitPct",
    label: "Seasonal rainfall deficit",
    hint: "How much drier than the historical normal",
    min: 0,
    max: 40,
    step: 5,
    format: (v) => (v === 0 ? "Normal" : `−${v}%`),
  },
  {
    key: "tempRiseC",
    label: "Mean temperature rise",
    hint: "Warmer than the historical average",
    min: 0,
    max: 3,
    step: 0.5,
    format: (v) => (v === 0 ? "Normal" : `+${v} °C`),
  },
  {
    key: "extraDrySpellDays",
    label: "Longer dry spells",
    hint: "Extra consecutive dry days",
    min: 0,
    max: 15,
    step: 1,
    format: (v) => (v === 0 ? "Normal" : `+${v} days`),
  },
  {
    key: "variabilityPct",
    label: "Rainfall variability",
    hint: "More swing from week to week",
    min: 0,
    max: 50,
    step: 5,
    format: (v) => (v === 0 ? "Normal" : `+${v}%`),
  },
]

const presets: { label: string; value: ScenarioInput }[] = [
  {
    label: "Dry year",
    value: { rainfallDeficitPct: 30, tempRiseC: 1, extraDrySpellDays: 10, variabilityPct: 20 },
  },
  {
    label: "Hot year",
    value: { rainfallDeficitPct: 10, tempRiseC: 2.5, extraDrySpellDays: 5, variabilityPct: 15 },
  },
  {
    label: "Severe stress",
    value: { rainfallDeficitPct: 40, tempRiseC: 3, extraDrySpellDays: 15, variabilityPct: 40 },
  },
]

type Props = {
  input: ScenarioInput
  onChange: (v: ScenarioInput) => void
  onReset: () => void
  isUpdating: boolean
}

export default function ScenarioControls({ input, onChange, onReset, isUpdating }: Props) {
  const isBaseline = JSON.stringify(input) === JSON.stringify(baselineScenario)

  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Stress-test controls</h2>
        <div className="flex items-center gap-2">
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-forest/50" />}
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            disabled={isBaseline}
            className="h-9 rounded-lg"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset to historical baseline
          </Button>
        </div>
      </div>
      <p className="mb-4 text-xs text-forest/60">
        Each control is an explicit adjustment to historical conditions. Zero means normal.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className="self-center text-xs text-forest/50">Examples:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.value)}
            className="rounded-full border border-forest/20 bg-white px-3 py-1.5 text-xs font-medium hover:bg-sage/20"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {controls.map((c) => (
          <div key={c.key} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{c.label}</span>
              <span className="font-semibold">{c.format(input[c.key])}</span>
            </div>
            <Slider
              value={[input[c.key]]}
              onValueChange={(v) => onChange({ ...input, [c.key]: v[0] })}
              min={c.min}
              max={c.max}
              step={c.step}
            />
            <p className="text-[11px] text-forest/50">{c.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}