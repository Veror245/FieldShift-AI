import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { FlaskConical, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import StrategyCard from "@/rotation-studio/StrategyCard"
import ComparisonTable from "@/rotation-studio/ComparisonTable"
import { getStrategies, USE_MOCK } from "@/services/api"
import { useFarmStore } from "@/store/useFarmStore"
import type { Strategy } from "@/types/api"

export default function RotationStudio() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["strategies"],
    queryFn: getStrategies,
  })
  const { selectedStrategyId, selectStrategy } = useFarmStore()
  const [pending, setPending] = useState<Strategy | null>(null)

  const baseline = data?.find((s) => s.kind === "baseline")
  const ranked = data ? [...data].sort((a, b) => b.overallScore - a.overallScore) : []
  const selected = data?.find((s) => s.id === selectedStrategyId)

  const confirm = () => {
    if (!pending) return
    selectStrategy(pending.id)
    toast.success(`"${pending.name}" selected for review.`)
    setPending(null)
  }

  return (
    <>
      <PageHeader
        title="Rotation Studio"
        description="Compare crop rotation options side by side. You stay in control of every decision."
      />

      {USE_MOCK && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
          <p>
            <strong>Demo data.</strong> Scores and crops are placeholders to preview the layout.
            They are not real recommendations.
          </p>
        </div>
      )}

      {selected && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-forest/20 bg-white p-4 text-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-forest" />
          <p>
            Selected for review: <strong>{selected.name}</strong>. Nothing has changed on your farm.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[640px] rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="rounded-2xl p-6 text-center">
          <p className="mb-3 text-sm">Could not load strategies.</p>
          <Button onClick={() => refetch()} className="rounded-xl">
            Try again
          </Button>
        </Card>
      )}

      {data && (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {data.map((s, i) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                baseline={baseline}
                rank={ranked.findIndex((r) => r.id === s.id) + 1}
                total={data.length}
                index={i}
                selected={s.id === selectedStrategyId}
                onSelect={setPending}
              />
            ))}
          </div>

          <ComparisonTable strategies={data} />

          <p className="text-xs text-forest/50">
            Scores compare these options against each other using the available evidence. They do
            not predict yield or income. Items marked for expert validation should be checked with
            a local agricultural expert.
          </p>
        </div>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Select &ldquo;{pending?.name}&rdquo; for review?</DialogTitle>
            <DialogDescription>
              This only marks it as the option you want to look at more closely. It does not change
              anything on your farm. Please check the flagged items with a local agricultural
              expert before making any planting or irrigation decisions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setPending(null)} className="h-11 rounded-xl">
              Cancel
            </Button>
            <Button onClick={confirm} className="h-11 rounded-xl">
              Yes, select for review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
