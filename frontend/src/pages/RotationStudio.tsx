import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowRight, FlaskConical, ShieldCheck } from "lucide-react"
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
import PriorityPanel from "@/rotation-studio/PriorityPanel"
import WhyDrawer from "@/rotation-studio/WhyDrawer"
import { getStrategies, USE_MOCK } from "@/services/api"
import { weightsToScores, type Weights } from "@/lib/scoring"
import { useFarmStore } from "@/store/useFarmStore"
import type { Strategy } from "@/types/api"

const rankMap = (list: Strategy[]) =>
  Object.fromEntries(
    [...list].sort((a, b) => b.overallScore - a.overallScore).map((s, i) => [s.id, i + 1])
  ) as Record<string, number>

export default function RotationStudio() {
  const qc = useQueryClient()
  const { selectedStrategyId, selectStrategy, weights: applied, setWeights } = useFarmStore()

  const [weights, setLocalWeights] = useState<Weights>(applied)
  const [pending, setPending] = useState<Strategy | null>(null)
  const [explaining, setExplaining] = useState<Strategy | null>(null)
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({})

  const {
    data: list,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["strategies", applied],
    queryFn: () => getStrategies(applied),
    staleTime: 60_000,
  })

  const ranks = list ? rankMap(list) : {}
  const baseline = list?.find((s) => s.kind === "baseline")
  const selected = list?.find((s) => s.id === selectedStrategyId)
  const dirty = JSON.stringify(weights) !== JSON.stringify(applied)

  const revise = useMutation({
    mutationFn: async (w: Weights) => {
      await qc.fetchQuery({
        queryKey: ["strategies", w],
        queryFn: () => getStrategies(w),
        staleTime: 60_000,
      })
      return w
    },
    onSuccess: (w) => {
      if (list) setPrevRanks(rankMap(list))
      setWeights(w)
      toast.success("Strategies revised with your priorities.")
    },
    onError: () => toast.error("Could not revise strategies. Please try again."),
  })

  const confirm = () => {
    if (!pending) return
    selectStrategy(pending.id)
    toast.success(`"${pending.name}" selected for review.`)
    setPending(null)
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Rotation Studio"
          description="Compare crop rotation options side by side. You stay in control of every decision."
        />
        <Button
          asChild
          className="h-10 rounded-xl bg-forest text-ivory hover:bg-forest/90 px-4 text-xs font-semibold shadow-sm transition-all"
        >
          <Link to="/reports">
            Go to Reports
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {USE_MOCK && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
          <p>
            <strong>Demo data.</strong> Scores and crops are placeholders. Revising uses a simple
            weighted average of those placeholders to preview the interaction. These are not real
            recommendations.
          </p>
        </div>
      )}

      {selected && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest/20 bg-white p-4 text-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-forest" />
            <p>
              Selected for review: <strong>{selected.name}</strong>. Nothing has changed on your farm.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-forest text-ivory hover:bg-forest/90">
            <Link to="/reports">
              Go to Reports
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
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

      {list && (
        <div className="space-y-8">
          <PriorityPanel
            weights={weights}
            onChange={setLocalWeights}
            onRevise={() => revise.mutate(weights)}
            revising={revise.isPending}
            dirty={dirty}
          />

          <div className="grid gap-6 md:grid-cols-2">
            {list.map((s, i) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                baseline={baseline}
                priorities={weightsToScores(weights)}
                rank={ranks[s.id]}
                rankChange={prevRanks[s.id] ? prevRanks[s.id] - ranks[s.id] : 0}
                total={list.length}
                index={i}
                selected={s.id === selectedStrategyId}
                onSelect={setPending}
                onExplain={setExplaining}
              />
            ))}
          </div>

          <ComparisonTable strategies={list} />

          <div className="flex justify-end pt-2">
            <Button
              asChild
              className="h-11 rounded-xl bg-forest text-ivory hover:bg-forest/90 px-6 font-semibold shadow-md transition-all"
            >
              <Link to="/reports">
                Go to Reports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

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

      <WhyDrawer strategy={explaining} onClose={() => setExplaining(null)} />
    </>
  )
}