import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FlaskConical, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import RuleBuilder from "@/watch/RuleBuilder"
import RuleList from "@/watch/RuleList"
import AlertList from "@/watch/AlertList"
import {
  createWatchRule,
  deleteWatchRule,
  getWatchAlerts,
  getWatchRules,
  reviewWatchAlert,
  updateWatchRule,
  USE_MOCK,
} from "@/services/api"

export default function FieldWatch() {
  const qc = useQueryClient()
  const rules = useQuery({ queryKey: ["watch-rules"], queryFn: getWatchRules })
  const alerts = useQuery({ queryKey: ["watch-alerts"], queryFn: getWatchAlerts })

  const refreshRules = () => qc.invalidateQueries({ queryKey: ["watch-rules"] })

  const create = useMutation({
    mutationFn: createWatchRule,
    onSuccess: () => {
      refreshRules()
      toast.success("Monitoring rule added.")
    },
    onError: () => toast.error("Could not add the rule. Please try again."),
  })

  const toggle = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => updateWatchRule(v.id, { enabled: v.enabled }),
    onSuccess: refreshRules,
    onError: () => toast.error("Could not update the rule."),
  })

  const remove = useMutation({
    mutationFn: deleteWatchRule,
    onSuccess: () => {
      refreshRules()
      toast.success("Rule removed.")
    },
    onError: () => toast.error("Could not remove the rule."),
  })

  const review = useMutation({
    mutationFn: reviewWatchAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watch-alerts"] }),
    onError: () => toast.error("Could not update the alert."),
  })

  const newCount = alerts.data?.filter((a) => a.status === "new").length ?? 0

  return (
    <>
      <PageHeader
        title="Field Watch"
        description="Tell us what to keep an eye on. You decide what to do with every alert."
      />

      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-forest p-4 text-sm text-ivory">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
        <p>
          <strong>Not real-time surveillance.</strong> Satellite and climate datasets are published
          with delays and describe wide areas. Alerts are written after the evidence is compared
          with the historical baseline.
        </p>
      </div>

      {USE_MOCK && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
          <p>
            <strong>Demo data.</strong> Rules and alerts are placeholders stored in memory. They
            are not real observations and reset when you refresh the page.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <RuleBuilder onCreate={(r) => create.mutate(r)} creating={create.isPending} />

          {rules.isLoading && <Skeleton className="h-40 rounded-2xl" />}
          {rules.isError && (
            <Card className="rounded-2xl p-6 text-center">
              <p className="mb-3 text-sm">Could not load your rules.</p>
              <Button onClick={() => rules.refetch()} className="rounded-xl">
                Try again
              </Button>
            </Card>
          )}
          {rules.data && (
            <RuleList
              rules={rules.data}
              onToggle={(id, enabled) => toggle.mutate({ id, enabled })}
              onDelete={(id) => remove.mutate(id)}
            />
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-semibold">Alert history</h2>
            {newCount > 0 && (
              <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-white">
                {newCount} new
              </span>
            )}
          </div>

          {alerts.isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          )}
          {alerts.isError && (
            <Card className="rounded-2xl p-6 text-center">
              <p className="mb-3 text-sm">Could not load alerts.</p>
              <Button onClick={() => alerts.refetch()} className="rounded-xl">
                Try again
              </Button>
            </Card>
          )}
          {alerts.data && <AlertList alerts={alerts.data} onReview={(id) => review.mutate(id)} />}
        </div>
      </div>
    </>
  )
}