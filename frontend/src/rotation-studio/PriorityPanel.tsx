import { RefreshCw, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { defaultWeights, weightMeta, type Weights } from "@/lib/scoring"

type Props = {
  weights: Weights
  onChange: (w: Weights) => void
  onRevise: () => void
  revising: boolean
  dirty: boolean
}

export default function PriorityPanel({ weights, onChange, onRevise, revising, dirty }: Props) {
  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="font-semibold">What matters most to you?</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(defaultWeights)}
          className="h-9 rounded-lg"
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Reset
        </Button>
      </div>
      <p className="mb-5 text-xs text-forest/60">
        Move the sliders, then ask the planner to revise. Hard agronomic safety checks are never
        traded off against these priorities.
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {weightMeta.map((m) => (
          <div key={m.key} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{m.label}</span>
              <span className="font-semibold">{weights[m.key]}</span>
            </div>
            <Slider
              value={[weights[m.key]]}
              onValueChange={(v) => onChange({ ...weights, [m.key]: v[0] })}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-[11px] text-forest/50">{m.hint}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={onRevise}
        disabled={revising || !dirty}
        className="mt-5 h-12 w-full rounded-xl sm:w-auto"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${revising ? "animate-spin" : ""}`} />
        {revising ? "Revising…" : "Revise strategies"}
      </Button>
    </Card>
  )
}