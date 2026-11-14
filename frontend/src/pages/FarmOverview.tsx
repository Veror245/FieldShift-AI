import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowRight, BellRing, Check, FileText, Map as MapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import { Term } from "@/components/common/Term"
import FieldShape from "@/components/farm/FieldShape"
import {
  FieldDrawIcon,
  FarmDetailsIcon,
  InvestigationIcon,
  RotationCycleIcon,
  ReportCertIcon,
} from "@/components/farm/WorkflowStepIcons"
import { getClimateFindings, getStrategies, getWatchAlerts, USE_MOCK } from "@/services/api"
import { useFarmStore } from "@/store/useFarmStore"
import { pageContainer, pageItem } from "@/lib/motion"
import type { FarmProfile } from "@/types/farm"

const waterLabel: Record<FarmProfile["water"], string> = {
  reliable: "Reliable irrigation",
  unreliable: "Unreliable irrigation",
  rainfed: "Rain-fed only",
}

export default function FarmOverview() {
  const { polygon, hectares, profile, selectedStrategyId, weights, resetFarm, investigationResult } = useFarmStore()
  const climate = useQuery({ queryKey: ["climate"], queryFn: getClimateFindings })
  const alerts = useQuery({ queryKey: ["watch-alerts"], queryFn: getWatchAlerts })
    const strategies = useQuery({
    queryKey: ["strategies", weights],
    queryFn: () => getStrategies(weights),
    staleTime: 60_000,
  })

  const selected = strategies.data?.find((s) => s.id === selectedStrategyId)
  const newAlerts = alerts.data?.filter((a) => a.status === "new") ?? []

  const steps = [
    {
      label: "Draw your field",
      subtitle: "Boundary & GPS points",
      to: "/field",
      done: Boolean(polygon),
      Icon: FieldDrawIcon,
    },
    {
      label: "Add farm details",
      subtitle: "Soil & crop history",
      to: "/field",
      done: Boolean(profile),
      Icon: FarmDetailsIcon,
    },
    {
      label: "Run the investigation",
      subtitle: "Autonomous agents",
      to: "/field",
      done: Boolean(investigationResult),
      Icon: InvestigationIcon,
    },
    {
      label: "Compare rotations",
      subtitle: "Scenario models",
      to: "/strategies",
      done: Boolean(selected),
      Icon: RotationCycleIcon,
    },
    {
      label: "Get your report",
      subtitle: "Full verified dossier",
      to: "/reports",
      done: false,
      Icon: ReportCertIcon,
    },
  ]

  const avgRain = climate.data
    ? Math.round(climate.data.seasons.reduce((a, s) => a + s.rainfallMm, 0) / climate.data.seasons.length)
    : null
  const unusual = climate.data ? climate.data.seasons.filter((s) => s.isAnomaly).length : null

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={pageItem}>
        <PageHeader
          title="Farm Overview"
          description={
            <>
              Explore resilient crop rotations using satellite data such as <Term k="ndvi" /> and{" "}
              <Term k="soilMoisture" />.
            </>
          }
        />
      </motion.div>

      <motion.div
        variants={pageItem}
        className="mb-6 flex flex-col gap-4 rounded-2xl bg-forest p-6 text-ivory sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold">Understand your land. Explore your options.</h2>
          <p className="mt-1 text-sm text-ivory/70">
            Outline a field, share your priorities, and compare crop rotations side by side.
          </p>
        </div>
        <Button asChild variant="secondary" className="h-12 shrink-0 rounded-xl px-6 text-base">
          <Link to="/field">
            <MapIcon className="mr-2 h-5 w-5" />
            Investigate a field
          </Link>
        </Button>
      </motion.div>

      <motion.ol
        variants={pageItem}
        className="mb-6 grid max-sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        {steps.map((s, i) => {
          const StepIcon = s.Icon
          return (
            <li key={s.label}>
              <Link
                to={s.to}
                className="group relative flex h-full flex-col justify-between rounded-2xl border border-forest/15 bg-gradient-to-b from-white to-[#F9F7F2] p-3.5 shadow-xs transition-all hover:border-forest/40 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-forest/60">
                    Step 0{i + 1}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      s.done
                        ? "bg-forest text-ivory shadow-xs"
                        : "bg-forest/10 text-forest/60"
                    }`}
                  >
                    {s.done ? <Check className="h-3 w-3 stroke-[2.5]" /> : i + 1}
                  </span>
                </div>

                <div className="my-2 flex items-center justify-center py-1">
                  <StepIcon done={s.done} />
                </div>

                <div>
                  <p className="text-xs font-bold text-forest leading-tight group-hover:text-forest">
                    {s.label}
                  </p>
                  <p className="text-[10.5px] text-forest/60 truncate mt-0.5">
                    {s.subtitle}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </motion.ol>

      <motion.div variants={pageItem} className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Your farm</h2>
            {profile && (
              <Button variant="ghost" size="sm" onClick={resetFarm} className="h-9 rounded-lg text-xs">
                Clear saved farm
              </Button>
            )}
          </div>

          {profile && polygon ? (
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <FieldShape polygon={polygon} className="w-full" />
              <div className="space-y-2 text-sm">
                <p className="text-lg font-bold">{profile.farmName}</p>
                <p className="text-forest/70">{hectares.toFixed(2)} ha · {waterLabel[profile.water]}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  
                                    {profile.rotation.map((c, i) => (
                    <span
                      key={`${c.crop}-${i}`}
                      className="rounded-full bg-forest px-2.5 py-1 text-xs text-ivory"
                    >
                      {i + 1}. {c.crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-sage p-6 text-center text-sm text-forest/70">
              <p className="mb-3">No field yet. Start by drawing your field on the map.</p>
              <Button asChild className="rounded-xl">
                <Link to="/field">Draw a field</Link>
              </Button>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl p-5">
          <h2 className="mb-3 font-semibold">Climate at a glance</h2>
          {USE_MOCK && <p className="mb-3 text-xs text-sun">Demo data, not real observations.</p>}
          {climate.isLoading && <Skeleton className="h-24 rounded-xl" />}
          {climate.data && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ivory p-4">
                <p className="text-xs text-forest/60">Average seasonal rainfall</p>
                <p className="text-2xl font-bold">{avgRain} mm</p>
              </div>
              <div className="rounded-xl bg-ivory p-4">
                <p className="text-xs text-forest/60">Unusual seasons</p>
                <p className="text-2xl font-bold">
                  {unusual} <span className="text-sm font-medium text-forest/60">of {climate.data.seasons.length}</span>
                </p>
              </div>
            </div>
          )}
          <Button asChild variant="ghost" className="mt-3 h-10 rounded-lg px-2">
            <Link to="/findings">
              See climate findings <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </Card>

        <Card className="rounded-2xl p-5">
          <h2 className="mb-3 font-semibold">Selected for review</h2>
          {selected ? (
            <>
              <p className="text-lg font-bold">{selected.name}</p>
              <p className="mt-1 text-sm text-forest/70">{selected.sequence.map((c) => c.crop).join(" → ")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="secondary" className="h-10 rounded-xl">
                  <Link to="/strategies">Compare again</Link>
                </Button>
                <Button asChild className="h-10 rounded-xl">
                  <Link to="/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    Open report
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-forest/70">
              Nothing selected yet. Compare the rotations in the Rotation Studio and select one to
              review. Nothing changes on your farm until you decide.
            </p>
          )}
        </Card>

        <Card className="rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-semibold">Field Watch alerts</h2>
            {newAlerts.length > 0 && (
              <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-white">
                {newAlerts.length} new
              </span>
            )}
          </div>
          {alerts.isLoading && <Skeleton className="h-24 rounded-xl" />}
          {alerts.data && newAlerts.length === 0 && (
            <p className="text-sm text-forest/70">No new alerts.</p>
          )}
          <ul className="space-y-2">
            {newAlerts.slice(0, 2).map((a) => (
              <li key={a.id} className="flex gap-2 rounded-xl bg-ivory p-3 text-sm">
                <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
                {a.title}
              </li>
            ))}
          </ul>
          <Button asChild variant="ghost" className="mt-3 h-10 rounded-lg px-2">
            <Link to="/watch">
              Open Field Watch <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  )
}
