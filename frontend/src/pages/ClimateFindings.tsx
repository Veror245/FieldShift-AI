import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, FlaskConical, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import { Term } from "@/components/common/Term"
import ClimateAnomalyChart from "@/charts/ClimateAnomalyChart"
import { getClimateFindings } from "@/services/api"
import { USE_MOCK } from "@/services/api"

const clusterDot = ["bg-sage", "bg-forest/40", "bg-sun"]

export default function ClimateFindings() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["climate"],
    queryFn: getClimateFindings,
  })

  return (
    <>
      <PageHeader
        title="Climate Findings"
        description={
          <>
            How your area&apos;s seasons have behaved over time, including{" "}
            <Term k="rainfallAnomaly">unusual seasons</Term>.
          </>
        }
      />

      {USE_MOCK && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
          <p>
            <strong>Demo data.</strong> These numbers are placeholders to preview the layout.
            They are not real observations.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <Card className="rounded-2xl p-6 text-center">
          <p className="mb-3 text-sm">Could not load climate findings.</p>
          <Button onClick={() => refetch()} className="rounded-xl">
            Try again
          </Button>
        </Card>
      )}

      {data && (() => {
        const seasons = data.seasons
        const avg = Math.round(seasons.reduce((a, s) => a + s.rainfallMm, 0) / seasons.length)
        const driest = seasons.reduce((a, b) => (b.rainfallMm < a.rainfallMm ? b : a))
        const unusual = seasons.filter((s) => s.isAnomaly).length

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-2xl p-5">
                <p className="text-sm text-forest/60">Average seasonal rainfall</p>
                <p className="mt-1 text-3xl font-bold">{avg} mm</p>
              </Card>
              <Card className="rounded-2xl p-5">
                <p className="text-sm text-forest/60">Driest season on record</p>
                <p className="mt-1 text-3xl font-bold">{driest.year}</p>
                <p className="text-xs text-forest/60">{driest.rainfallMm} mm</p>
              </Card>
              <Card className="rounded-2xl p-5">
                <p className="text-sm text-forest/60">Unusual seasons</p>
                <p className="mt-1 text-3xl font-bold">
                  {unusual} <span className="text-lg font-medium text-forest/60">of {seasons.length}</span>
                </p>
              </Card>
            </div>

            <Card className="rounded-2xl p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{data.seasonLabel}</h2>
                <div className="flex items-center gap-4 text-xs text-forest/70">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-sage" /> Normal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-sun" /> Unusual
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-forest" /> Temperature
                  </span>
                </div>
              </div>
              <ClimateAnomalyChart seasons={seasons} />
              <p className="mt-3 text-xs text-forest/60">
                An unusual season means conditions differed from the historical pattern. It does
                not prove a crop failed. {data.resolutionNote}
              </p>
            </Card>

            <div>
              <h2 className="mb-3 font-semibold">Season fingerprints</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {data.clusters.map((c, i) => {
                  const count = seasons.filter((s) => s.cluster === c.id).length
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <Card className="h-full rounded-2xl p-5">
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${clusterDot[c.id] ?? "bg-sage"}`} />
                          <h3 className="font-semibold">{c.name}</h3>
                        </div>
                        <p className="text-2xl font-bold">
                          {count} <span className="text-sm font-medium text-forest/60">of {seasons.length} years</span>
                        </p>
                        <p className="mt-2 text-sm text-forest/70">{c.description}</p>
                        <p className="mt-3 text-xs text-forest/50">
                          {seasons.filter((s) => s.cluster === c.id).map((s) => s.year).join(", ")}
                        </p>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <Card className="rounded-2xl border-sage bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <History className="h-5 w-5 text-forest" />
                <h2 className="font-semibold">Climate memory: {data.currentSeason.label}</h2>
              </div>
              <p className="mb-4 text-sm text-forest/80">{data.currentSeason.summary}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {data.currentSeason.similar.map((s) => (
                  <div key={s.year} className="rounded-xl bg-ivory p-4">
                    <p className="text-xl font-bold">{s.year}</p>
                    <p className="text-xs text-forest/70">{s.reason}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-forest/60">
                Similar seasons do not mean similar crop yields.
              </p>
            </Card>

            <p className="text-xs text-forest/50">Source: {data.source}</p>

            <Button asChild className="h-12 rounded-xl">
              <Link to="/strategies">
                Continue to rotation strategies
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        )
      })()}
    </>
  )
}
