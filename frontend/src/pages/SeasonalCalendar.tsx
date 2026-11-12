import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { FlaskConical, Sprout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import SeasonalTimeline, { TimelineLegend } from "@/charts/SeasonalTimeline"
import { monthsOf } from "@/lib/calendar"
import { getSeasonalCalendar, USE_MOCK } from "@/services/api"
import { pageContainer, pageItem, softSpring } from "@/lib/motion"

export default function CalendarPage() {
  const [months, setMonths] = useState<12 | 24>(24)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar"],
    queryFn: getSeasonalCalendar,
  })

  return (
    <motion.div variants={pageContainer} initial="hidden" animate="visible">
      <motion.div variants={pageItem}>
        <PageHeader
          title="Seasonal Calendar"
          description="When each rotation is sown, grows, is harvested, and leaves the field bare."
        />
      </motion.div>

      {USE_MOCK && (
        <motion.div
          variants={pageItem}
          className="mb-6 flex items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm"
        >
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
          <p>
            <strong>Demo data.</strong> Timings are placeholders, not verified planting windows for
            your region. Check real dates with a local agricultural expert.
          </p>
        </motion.div>
      )}

      {isLoading && <Skeleton className="h-96 rounded-2xl" />}

      {isError && (
        <Card className="rounded-2xl p-6 text-center">
          <p className="mb-3 text-sm">Could not load the calendar.</p>
          <Button onClick={() => refetch()} className="rounded-xl">
            Try again
          </Button>
        </Card>
      )}

      {data && (
        <motion.div variants={pageItem} className="space-y-6">
          <Card className="rounded-2xl p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TimelineLegend />
              <div className="flex rounded-xl bg-forest/10 p-1">
                {([12, 24] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-months-toggle={m}
                    onClick={() => setMonths(m)}
                    className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      months === m ? "text-ivory" : "text-forest/70"
                    }`}
                  >
                    {months === m && (
                      <motion.span
                        layoutId="cal-range-pill"
                        transition={softSpring}
                        className="absolute inset-0 rounded-lg bg-forest"
                      />
                    )}
                    <span className="relative z-10">{m} months</span>
                  </button>
                ))}
              </div>
            </div>
            <SeasonalTimeline calendar={data} months={months} />
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.rows.map((row) => {
              const bare = monthsOf(row, "bare", months)
              const cover = monthsOf(row, "cover", months)
              return (
                <Card key={row.strategyId} className="rounded-2xl p-5">
                  <h3 className="mb-3 font-semibold">{row.name}</h3>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-forest/70">Bare-field months</dt>
                      <dd className={bare > 0 ? "font-bold text-sun" : "font-bold"}>{bare}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-forest/70">Cover-crop months</dt>
                      <dd className="font-bold">{cover}</dd>
                    </div>
                  </dl>
                </Card>
              )
            })}
          </div>

          <Card className="flex items-start gap-3 rounded-2xl border-sage bg-white p-5 text-sm">
            <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
            <p>
              Bare-field windows are chances to explore a cover crop that protects the soil.
              Whether one suits your field, water and workload should be checked with a local
              agricultural expert.
            </p>
          </Card>

          <p className="text-xs text-forest/50">Source: {data.source}</p>
        </motion.div>
      )}
    </motion.div>
  )
}