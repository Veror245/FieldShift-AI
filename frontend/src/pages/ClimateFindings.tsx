import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRightIcon, FlaskIcon, HistoryIcon } from "@/components/common/Icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { Term } from "@/components/common/Term"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import ClimateAnomalyChart from "@/charts/ClimateAnomalyChart"
import { getClimateFindings, USE_MOCK } from "@/services/api"
import { pageContainer, pageItem } from "@/lib/motion"

const clusterDot = ["bg-[#4E633D]", "bg-[#7E9167]", "bg-[#A66843]"]

export default function ClimateFindings() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["climate"],
    queryFn: getClimateFindings,
  })

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={pageItem} className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Climate Findings"
          description={
            <>
              Historical weather variability and{" "}
              <Term k="rainfallAnomaly">unusual seasons</Term> over the last 10 years.
            </>
          }
        />
        {USE_MOCK && (
          <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#A66843]/15 border border-[#A66843]/35 text-[#A66843] shadow-sm">
            <FlaskIcon className="h-3.5 w-3.5" />
            <span>Simulated NASA POWER Data</span>
          </div>
        )}
      </motion.div>

      {isLoading && (
        <LoadingState
          message="Analyzing NASA climate records…"
          subtext="Extracting historical precipitation and anomaly clusters"
        />
      )}

      {isError && (
        <ErrorState
          title="Could not load climate findings"
          message="Failed to retrieve seasonal weather observations. Check connection and retry."
          onRetry={() => refetch()}
        />
      )}

      {data && (() => {
        const seasons = data.seasons
        const avg = Math.round(seasons.reduce((a, s) => a + s.rainfallMm, 0) / seasons.length)
        const driest = seasons.reduce((a, b) => (b.rainfallMm < a.rainfallMm ? b : a))
        const unusual = seasons.filter((s) => s.isAnomaly).length

        return (
          <motion.div variants={pageContainer} className="space-y-4">
            <motion.div variants={pageItem} className="grid gap-3 sm:grid-cols-3">
              <Card className="rounded-2xl p-4">
                <p className="text-xs text-[#5C5A52]">Average seasonal rainfall</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#1E241B]">
                    <AnimatedNumber value={avg} decimals={0} />
                  </span>
                  <span className="text-xs font-semibold text-[#5C5A52]">mm</span>
                </div>
              </Card>

              <Card className="rounded-2xl p-4">
                <p className="text-xs text-[#5C5A52]">Driest season on record</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-[#1E241B]">{driest.year}</span>
                  <span className="text-xs text-[#A66843] font-semibold">
                    (<AnimatedNumber value={driest.rainfallMm} decimals={0} suffix=" mm" />)
                  </span>
                </div>
              </Card>

              <Card className="rounded-2xl p-4">
                <p className="text-xs text-[#5C5A52]">Unusual weather anomalies</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#A66843]">
                    <AnimatedNumber value={unusual} decimals={0} />
                  </span>
                  <span className="text-xs font-medium text-[#5C5A52]">of {seasons.length} seasons</span>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={pageItem} className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
              <div className="space-y-4">
                <Card className="rounded-2xl p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-sm text-[#1E241B]">{data.seasonLabel}</h2>
                      <p className="text-[11px] text-[#5C5A52]">Annual rainfall distribution & mean temperature curve</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#5C5A52]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded bg-[#4E633D]" /> Normal
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded bg-[#A66843]" /> Anomaly
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-3.5 bg-[#1E241B]" /> Temp
                      </span>
                    </div>
                  </div>

                  <ClimateAnomalyChart seasons={seasons} />

                  <p className="mt-2 text-[11px] text-[#7E7A6E] leading-relaxed">
                    Condition anomalies reflect significant deviation from historical baseline. {data.resolutionNote}
                  </p>
                </Card>

                <Card className="rounded-2xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4 text-[#4E633D]" />
                    <h2 className="font-semibold text-sm text-[#1E241B]">Climate memory: {data.currentSeason.label}</h2>
                  </div>
                  <p className="mb-3 text-xs text-[#5C5A52] leading-relaxed">{data.currentSeason.summary}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {data.currentSeason.similar.map((s) => (
                      <div
                        key={s.year}
                        className="rounded-xl bg-[#E8E2D4] border border-[#D4CCB9] p-2.5"
                      >
                        <span className="text-base font-bold text-[#1E241B]">{s.year}</span>
                        <p className="text-[10px] text-[#5C5A52] leading-tight mt-0.5">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <Card className="rounded-2xl p-4 flex-1">
                  <h2 className="mb-1 font-semibold text-sm text-[#1E241B]">Seasonal Clusters (KMeans)</h2>
                  <p className="mb-3 text-[11px] text-[#5C5A52]">Grouping 20-year NASA observations into climate typologies</p>
                  <div className="space-y-2.5">
                    {data.clusters.map((c) => {
                      const count = seasons.filter((s) => s.cluster === c.id).length
                      const pct = Math.round((count / seasons.length) * 100)
                      return (
                        <div
                          key={c.id}
                          className="rounded-xl border border-[#D4CCB9] bg-[#E8E2D4] p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${clusterDot[c.id] ?? "bg-[#4E633D]"}`} />
                              <h3 className="font-semibold text-xs text-[#1E241B]">{c.name}</h3>
                            </div>
                            <span className="text-xs font-bold text-[#1E241B]">
                              <AnimatedNumber value={count} decimals={0} suffix=" yrs" /> (<AnimatedNumber value={pct} decimals={0} suffix="%" />)
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5C5A52] leading-relaxed">{c.description}</p>
                          <p className="mt-1 text-[10px] text-[#7E7A6E] font-mono">
                            {seasons.filter((s) => s.cluster === c.id).map((s) => s.year).join(", ")}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <div className="space-y-2">
                  <Button asChild className="h-12 w-full rounded-xl bg-[#4E633D] text-[#F7F4EC] hover:bg-[#5D7749] shadow-lg hover:shadow-xl transition-all">
                    <Link to="/strategies">
                      Compare rotation strategies
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-[10px] text-center text-[#7E7A6E]">Source: {data.source}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )
      })()}
    </motion.div>
  )
}
