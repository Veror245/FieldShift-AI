import { motion } from "framer-motion"
import { FlaskConical, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import ScenarioControls from "@/rotation-studio/ScenarioControls"
import ScenarioResults from "@/rotation-studio/ScenarioResults"
import { useScenarioLab } from "@/hooks/useScenarioLab"
import { USE_MOCK } from "@/services/api"
import { pageContainer, pageItem } from "@/lib/motion"

export default function ScenarioLab() {
  const { input, setInput, reset, result, isLoading, isError, refetch, isUpdating } =
    useScenarioLab()

  return (
    <motion.div variants={pageContainer} initial="hidden" animate="visible">
      <motion.div variants={pageItem}>
        <PageHeader
          title="Scenario Lab"
          description="See how each rotation holds up if conditions turn out different from the past."
        />
      </motion.div>

      <motion.div
        variants={pageItem}
        className="mb-6 flex items-start gap-3 rounded-2xl bg-forest p-4 text-sm text-ivory"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
        <p>
          <strong>Stress test, not a forecast.</strong> These are explicit what-if adjustments to
          historical conditions. They do not predict future weather, yield or income.
        </p>
      </motion.div>

      {USE_MOCK && (
        <motion.div
          variants={pageItem}
          className="mb-6 flex items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm"
        >
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
          <p>
            <strong>Demo data.</strong> Scores and the stress calculation are placeholders to
            preview the interaction. They are not real results.
          </p>
        </motion.div>
      )}

      <motion.div variants={pageItem} className="space-y-8">
        <ScenarioControls
          input={input}
          onChange={setInput}
          onReset={reset}
          isUpdating={isUpdating}
        />

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {isError && (
          <Card className="rounded-2xl p-6 text-center">
            <p className="mb-3 text-sm">Could not evaluate this scenario.</p>
            <Button onClick={() => refetch()} className="rounded-xl">
              Try again
            </Button>
          </Card>
        )}

        {result && <ScenarioResults result={result} />}

        <p className="text-xs text-forest/50">
          Scenario results recalculate environmental suitability only. Hard agronomic safety checks
          still apply, and local expert validation is advised before any decision.
        </p>
      </motion.div>
    </motion.div>
  )
}