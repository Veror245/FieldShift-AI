import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowRight,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Sun,
  Wind,
  Droplets,
  Calendar,
  Layers,
  CheckCircle2,
  Database,
  Activity,
} from "lucide-react"
import { ArrowRightIcon, HistoryIcon } from "@/components/common/Icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { Term } from "@/components/common/Term"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import ClimateAnomalyChart from "@/charts/ClimateAnomalyChart"
import { getClimateFindings } from "@/services/api"
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
              NASA POWER 30-year agroclimatology records, KMeans seasonal clusters, and{" "}
              <Term k="rainfallAnomaly">monsoon anomalies</Term>.
            </>
          }
        />
        <Button
          asChild
          className="h-10 rounded-xl bg-[#4E633D] text-[#F7F4EC] hover:bg-[#5D7749] px-4 text-xs font-semibold shadow-sm transition-all"
        >
          <Link to="/strategies">
            Compare rotation strategies
            <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
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
        const raw = data.rawClimate
        const baseline = raw?.baseline_comparison ?? data.baseline
        const anomalies = raw?.anomalies ?? data.anomalies ?? []
        const currentAnomaly = anomalies[0]
        const earth = data.earthObs
        const currentSeason = raw?.current_season

        const recentPrecip = baseline?.recent_precip_mm ?? currentAnomaly?.features.total_rainfall ?? 1051.94
        const histAvgPrecip = baseline?.historical_avg_mm ?? 1284.22
        const devPct = baseline?.deviation_pct ?? -18.09
        const anomalyScore = currentAnomaly?.score ?? 0.627
        const meanTemp30yr = earth?.temperature_c ?? 25.25
        const totalRecordDays = earth?.n_days ?? 11323

        return (
          <motion.div variants={pageContainer} className="space-y-4">
            <motion.div variants={pageItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-2xl p-4 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#5C5A52]">Recent Kharif Rainfall</p>
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F4EBE4] text-[#8C5331] border border-[#E2D5CC]">
                    <CloudRain className="h-3 w-3 text-[#8C5331]" />
                    {devPct.toFixed(1)}% deficit
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#1E241B]">
                    <AnimatedNumber value={Math.round(recentPrecip)} decimals={0} />
                  </span>
                  <span className="text-xs font-semibold text-[#5C5A52]">mm</span>
                </div>
                <p className="mt-1 text-[11px] text-[#7E7A6E]">
                  Historical avg: {Math.round(histAvgPrecip)} mm
                </p>
              </Card>

              <Card className="rounded-2xl p-4 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#5C5A52]">Anomaly Severity</p>
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F4EBE4] text-[#8C5331] border border-[#E2D5CC]">
                    <AlertTriangle className="h-3 w-3 text-[#8C5331]" />
                    Significant
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#1E241B]">
                    <AnimatedNumber value={anomalyScore * 100} decimals={1} suffix="%" />
                  </span>
                  <span className="text-xs font-semibold text-[#5C5A52]">score ({anomalyScore.toFixed(2)})</span>
                </div>
                <p className="mt-1 text-[11px] text-[#7E7A6E]">
                  Date range: {currentAnomaly?.date_range ?? "Kharif 2025"}
                </p>
              </Card>

              <Card className="rounded-2xl p-4 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#5C5A52]">30-Yr Mean Temp</p>
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#EAEFE6] text-[#2D3B26] border border-[#D5DFD0]">
                    <Thermometer className="h-3 w-3 text-[#2D3B26]" />
                    NASA POWER
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#1E241B]">
                    <AnimatedNumber value={meanTemp30yr} decimals={2} />
                  </span>
                  <span className="text-xs font-semibold text-[#5C5A52]">°C</span>
                </div>
                <p className="mt-1 text-[11px] text-[#7E7A6E]">
                  Coverage: 1995-01-01 to 2025-12-31
                </p>
              </Card>

              <Card className="rounded-2xl p-4 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#5C5A52]">Observation Record</p>
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#EFECE4] text-[#4E633D] border border-[#DCD7CA]">
                    <CheckCircle2 className="h-3 w-3 text-[#4E633D]" />
                    0 missing days
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#1E241B]">
                    <AnimatedNumber value={totalRecordDays} decimals={0} />
                  </span>
                  <span className="text-xs font-semibold text-[#5C5A52]">daily steps (30 yrs)</span>
                </div>
                <p className="mt-1 text-[11px] text-[#7E7A6E]">
                  Resolution: {earth?.grid_resolution_deg ?? 0.5}° spatial grid
                </p>
              </Card>
            </motion.div>

            {currentAnomaly && (
              <motion.div variants={pageItem}>
                <Card className="rounded-2xl border border-[#D4CCB9] bg-[#FAF8F3] p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D4CCB9]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4E633D]/10 text-[#4E633D]">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#1E241B]">
                          Detected Climate Anomaly: {currentAnomaly.date_range}
                        </h2>
                        <p className="text-xs text-[#5C5A52]">
                          Unusual seasonal pattern flagged by multivariate ML cluster evaluation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#D4CCB9] bg-[#E8E2D4] px-3 py-1 text-xs font-semibold text-[#1E241B]">
                        Severity Score: {currentAnomaly.score.toFixed(3)}
                      </span>
                      <span className="rounded-full border border-[#4E633D]/25 bg-[#4E633D]/10 px-3 py-1 text-xs font-semibold text-[#4E633D]">
                        Typology: {currentSeason?.label ?? "Kharif-like"} (d = {currentSeason?.distance_to_centroid.toFixed(2) ?? "2.28"})
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                    <div className="rounded-xl border border-[#D4CCB9] bg-white p-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#5C5A52]">
                        <Thermometer className="h-3.5 w-3.5 text-[#4E633D]" />
                        Avg Temp
                      </span>
                      <p className="mt-1 text-base font-bold text-[#1E241B]">
                        {currentAnomaly.features.avg_temperature.toFixed(2)} °C
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#D4CCB9] bg-white p-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#5C5A52]">
                        <CloudRain className="h-3.5 w-3.5 text-[#4E633D]" />
                        Total Rainfall
                      </span>
                      <p className="mt-1 text-base font-bold text-[#1E241B]">
                        {currentAnomaly.features.total_rainfall.toFixed(1)} mm
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#D4CCB9] bg-white p-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#5C5A52]">
                        <Activity className="h-3.5 w-3.5 text-[#4E633D]" />
                        Rainfall Std Dev
                      </span>
                      <p className="mt-1 text-base font-bold text-[#1E241B]">
                        {currentAnomaly.features.rainfall_std.toFixed(2)} mm
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#D4CCB9] bg-white p-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#5C5A52]">
                        <Sun className="h-3.5 w-3.5 text-[#4E633D]" />
                        Solar Radiation
                      </span>
                      <p className="mt-1 text-base font-bold text-[#1E241B]">
                        {currentAnomaly.features.avg_solar_radiation.toFixed(2)} MJ/m²
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#D4CCB9] bg-white p-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#5C5A52]">
                        <Droplets className="h-3.5 w-3.5 text-[#4E633D]" />
                        Avg Humidity
                      </span>
                      <p className="mt-1 text-base font-bold text-[#1E241B]">
                        {currentAnomaly.features.avg_humidity.toFixed(1)} %
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#D4CCB9] bg-white p-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#5C5A52]">
                        <Wind className="h-3.5 w-3.5 text-[#4E633D]" />
                        Avg Wind Speed
                      </span>
                      <p className="mt-1 text-base font-bold text-[#1E241B]">
                        {currentAnomaly.features.avg_wind_speed.toFixed(2)} m/s
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#D4CCB9] bg-white p-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#5C5A52]">
                        <Calendar className="h-3.5 w-3.5 text-[#4E633D]" />
                        Rainy Day Ratio
                      </span>
                      <p className="mt-1 text-base font-bold text-[#1E241B]">
                        {(currentAnomaly.features.rainy_day_ratio * 100).toFixed(1)} %
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div variants={pageItem} className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
              <div className="space-y-4">
                <Card className="rounded-2xl p-4 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
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

                {earth && (
                  <Card className="rounded-2xl p-4 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
                    <div className="mb-3 flex items-center justify-between border-b border-[#D4CCB9] pb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-[#4E633D]" />
                        <h2 className="font-semibold text-sm text-[#1E241B]">
                          NASA POWER Agroclimatology (30-Year Earth Observations)
                        </h2>
                      </div>
                      <span className="text-[11px] font-mono text-[#5C5A52]">
                        {earth.source} · {earth.grid_resolution_deg}° Grid
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      <div className="rounded-xl border border-[#D4CCB9] bg-white p-2.5">
                        <span className="text-[10px] text-[#5C5A52] block">Observation Span</span>
                        <span className="text-xs font-bold text-[#1E241B]">
                          {earth.start_date} to {earth.end_date}
                        </span>
                        <span className="text-[10px] text-[#7E7A6E] block mt-0.5">
                          {earth.n_days ?? 11323} days ({earth.missing_days ?? 0} missing)
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#D4CCB9] bg-white p-2.5">
                        <span className="text-[10px] text-[#5C5A52] block">Cumulative Rainfall</span>
                        <span className="text-xs font-bold text-[#1E241B]">
                          {earth.precipitation_mm.toLocaleString()} mm
                        </span>
                        <span className="text-[10px] text-[#7E7A6E] block mt-0.5">
                          30-year total precip
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#D4CCB9] bg-white p-2.5">
                        <span className="text-[10px] text-[#5C5A52] block">Mean Temperature</span>
                        <span className="text-xs font-bold text-[#1E241B]">
                          {earth.temperature_c.toFixed(2)} °C
                        </span>
                        <span className="text-[10px] text-[#7E7A6E] block mt-0.5">
                          Daily average 1995–2025
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#D4CCB9] bg-white p-2.5">
                        <span className="text-[10px] text-[#5C5A52] block">Mean Relative Humidity</span>
                        <span className="text-xs font-bold text-[#1E241B]">
                          {earth.humidity_pct?.toFixed(2) ?? "44.01"} %
                        </span>
                        <span className="text-[10px] text-[#7E7A6E] block mt-0.5">
                          Atmospheric surface vapor
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#D4CCB9] bg-white p-2.5">
                        <span className="text-[10px] text-[#5C5A52] block">Solar Irradiance</span>
                        <span className="text-xs font-bold text-[#1E241B]">
                          {earth.solar_radiation_mj?.toFixed(2) ?? "18.12"} MJ/m²
                        </span>
                        <span className="text-[10px] text-[#7E7A6E] block mt-0.5">
                          All-sky surface insolation
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#D4CCB9] bg-white p-2.5">
                        <span className="text-[10px] text-[#5C5A52] block">Mean Wind Speed</span>
                        <span className="text-xs font-bold text-[#1E241B]">
                          {earth.wind_speed_ms?.toFixed(2) ?? "1.63"} m/s
                        </span>
                        <span className="text-[10px] text-[#7E7A6E] block mt-0.5">
                          10m aerodynamic height
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="rounded-2xl p-4 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4 text-[#4E633D]" />
                    <h2 className="font-semibold text-sm text-[#1E241B]">Climate Memory: {data.currentSeason.label}</h2>
                  </div>
                  <p className="mb-3 text-xs text-[#5C5A52] leading-relaxed">{data.currentSeason.summary}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {data.currentSeason.similar.map((s) => (
                      <div
                        key={s.year}
                        className="rounded-xl bg-[#E8E2D4] border border-[#D4CCB9] p-2.5"
                      >
                        <span className="text-base font-bold text-[#1E241B]">{s.year}</span>
                        <p className="text-[11px] text-[#5C5A52] leading-tight mt-0.5">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <Card className="rounded-2xl p-4 flex-1 bg-[#FAF8F3] border border-[#D4CCB9] shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold text-sm text-[#1E241B]">Seasonal Clusters (KMeans)</h2>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#4E633D] bg-[#E8E2D4] px-2 py-0.5 rounded-full border border-[#D4CCB9]">
                      <Layers className="h-3 w-3" />
                      3 Agro-Typologies
                    </span>
                  </div>
                  <p className="mb-3 text-[11px] text-[#5C5A52]">
                    KMeans clustering of 30-year multi-variable NASA agro-meteorology records
                  </p>

                  <div className="space-y-3">
                    {(raw?.season_clusters ?? data.clusters).map((c, idx) => {
                      const clusterId = "cluster_id" in c ? c.cluster_id : c.id
                      const clusterLabel = "label" in c ? c.label : c.name
                      const clusterSize = ("size" in c && typeof c.size === "number") ? c.size : 30
                      const centroid = "centroid" in c ? c.centroid : c.centroid

                      return (
                        <div
                          key={clusterId}
                          className="rounded-xl border border-[#D4CCB9] bg-white p-3 transition-all hover:bg-[#FAF8F3]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${clusterDot[idx] ?? "bg-[#4E633D]"}`} />
                              <h3 className="font-bold text-xs text-[#1E241B]">{clusterLabel}</h3>
                            </div>
                            <span className="text-xs font-bold text-[#1E241B] rounded-md bg-[#E8E2D4] px-2 py-0.5 border border-[#D4CCB9]">
                              {clusterSize} seasons ({Math.round((clusterSize / 92) * 100)}%)
                            </span>
                          </div>

                          {centroid ? (
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-[#5C5A52] bg-[#FAF8F3] p-2 rounded-lg border border-[#D4CCB9]">
                              <div>
                                <span className="text-[#7E7A6E]">Avg Temp:</span>{" "}
                                <strong className="text-[#1E241B]">{centroid.avg_temperature.toFixed(1)} °C</strong>
                              </div>
                              <div>
                                <span className="text-[#7E7A6E]">Total Rain:</span>{" "}
                                <strong className="text-[#1E241B]">{Math.round(centroid.total_rainfall)} mm</strong>
                              </div>
                              <div>
                                <span className="text-[#7E7A6E]">Rain Std:</span>{" "}
                                <strong className="text-[#1E241B]">{centroid.rainfall_std.toFixed(1)} mm</strong>
                              </div>
                              <div>
                                <span className="text-[#7E7A6E]">Solar Rad:</span>{" "}
                                <strong className="text-[#1E241B]">{centroid.avg_solar_radiation.toFixed(1)} MJ/m²</strong>
                              </div>
                              <div>
                                <span className="text-[#7E7A6E]">Humidity:</span>{" "}
                                <strong className="text-[#1E241B]">{Math.round(centroid.avg_humidity)} %</strong>
                              </div>
                              <div>
                                <span className="text-[#7E7A6E]">Wind Speed:</span>{" "}
                                <strong className="text-[#1E241B]">{centroid.avg_wind_speed.toFixed(1)} m/s</strong>
                              </div>
                              <div className="col-span-2 pt-0.5 border-t border-[#D4CCB9]">
                                <span className="text-[#7E7A6E]">Rainy Day Ratio:</span>{" "}
                                <strong className="text-[#1E241B]">{(centroid.rainy_day_ratio * 100).toFixed(1)} %</strong>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-[#5C5A52] leading-relaxed">{"description" in c ? c.description : ""}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <div className="space-y-2">
                  <Button asChild className="h-12 w-full rounded-xl bg-[#4E633D] text-[#F7F4EC] hover:bg-[#5D7749] shadow-lg hover:shadow-xl transition-all">
                    <Link to="/strategies">
                      Compare rotation strategies
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-[10px] text-center text-[#7E7A6E]">
                    Source: {data.source}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )
      })()}
    </motion.div>
  )
}
