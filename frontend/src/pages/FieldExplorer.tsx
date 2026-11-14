import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { MapPin } from "lucide-react"
import FieldMap from "@/maps/FieldMap"
import FarmForm from "@/components/farm/FarmForm"
import GeoJsonUpload from "@/components/farm/GeoJsonUpload"
import ThinkingOrb from "@/components/common/ThinkingOrb"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { buildInvestigationRequest } from "@/lib/investigationRequest"
import { startInvestigation } from "@/services/api"
import { useFarmStore } from "@/store/useFarmStore"
import {
  computePolygonCentroid,
  formatCoordinates,
  reverseGeocode,
  type GeocodedAddress,
} from "@/utils/reverseGeocode"
import type { FarmProfile } from "@/types/farm"

const investigationStages = [
  {
    step: 1,
    title: "Scanning Field Boundary & Soil Profile",
    detail: "Processing GPS coordinates and analyzing regional soil texture.",
    orbState: "working" as const,
  },
  {
    step: 2,
    title: "Consulting NASA POWER Climatology",
    detail: "Fetching 30-year agro-climate observations and precipitation patterns.",
    orbState: "searching" as const,
  },
  {
    step: 3,
    title: "Evaluating Agronomic Suitability",
    detail: "Cross-referencing crop compatibility, disease breaks, and nitrogen balance.",
    orbState: "solving" as const,
  },
  {
    step: 4,
    title: "Synthesizing Pareto-Optimal Rotations",
    detail: "Optimizing 8-dimensional multi-objective crop rotation strategies.",
    orbState: "solving" as const,
  },
]

export default function FieldExplorer() {
  const navigate = useNavigate()

  const {
    polygon,
    hectares,
    profile,
    setField,
    setProfile,
    ensureFarmId,
    setInvestigationId,
    setInvestigationResult,
  } = useFarmStore()
  const [submitting, setSubmitting] = useState(false)
  const [investigating, setInvestigating] = useState(false)
  const [investigationStep, setInvestigationStep] = useState(0)
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number
    lng: number
    address?: GeocodedAddress
  } | null>(null)

  const corners = polygon ? polygon.geometry.coordinates[0].length - 1 : 0

  const coords = polygon?.geometry?.coordinates?.[0] as [number, number][] | undefined
  const [centroidLng, centroidLat] =
    coords && coords.length >= 3 ? computePolygonCentroid(coords) : [null, null]

  const { data: queryAddress, isLoading: loadingAddress } = useQuery({
    queryKey: ["reverseGeocode", centroidLng, centroidLat],
    queryFn: () =>
      centroidLng !== null && centroidLat !== null
        ? reverseGeocode(centroidLng, centroidLat)
        : null,
    enabled: Boolean(polygon && centroidLng !== null && centroidLat !== null),
    staleTime: 1000 * 60 * 30,
  })

  const activeCoords =
    centroidLat !== null && centroidLng !== null
      ? { lat: centroidLat, lng: centroidLng }
      : gpsLocation
        ? { lat: gpsLocation.lat, lng: gpsLocation.lng }
        : null

  const address = queryAddress || gpsLocation?.address || null

  const handleLocationFound = useCallback(
    (info: { lat: number; lng: number; address?: GeocodedAddress }) => {
      setGpsLocation(info)
    },
    []
  )

  const handleSubmit = async (values: FarmProfile) => {
    if (!polygon) {
      toast.error("Please draw your field on the map first.")
      return
    }
    setSubmitting(true)
    setInvestigating(true)
    setInvestigationStep(0)
    try {
      const request = buildInvestigationRequest({
        farmId: ensureFarmId(),
        polygon,
        profile: values,
      })
      const investigationPromise = startInvestigation(request)
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

      await wait(850)
      setInvestigationStep(1)
      await wait(950)
      setInvestigationStep(2)
      await wait(950)
      setInvestigationStep(3)

      const { investigationId, result } = await investigationPromise
      setProfile(values)
      setInvestigationId(investigationId)
      if (result) setInvestigationResult(result)

      await wait(650)
      setInvestigating(false)
      await wait(350)
      navigate("/strategies")
    } catch (e) {
      setInvestigating(false)
      toast.error(e instanceof Error ? e.message : "Could not start the investigation.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Field Explorer"
        description="Find your land, outline your field, then tell us about your farm."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="h-[84vh] min-h-[620px] lg:sticky lg:top-6">
          <FieldMap
            polygon={polygon}
            onChange={setField}
            onLocationFound={handleLocationFound}
          />
        </div>

        <div className="space-y-6 min-w-0">
          <Card className="rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-base text-forest">Field boundary</h2>
              {polygon && (
                <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
                  {hectares.toFixed(2)} ha
                </span>
              )}
            </div>

            {polygon ? (
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-forest/70">Area</dt>
                  <dd className="font-semibold text-forest">
                    {hectares.toFixed(2)} ha
                    <span className="ml-1 text-xs text-forest/60">
                      ({(hectares * 2.47105).toFixed(2)} acres)
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-forest/70">Corners</dt>
                  <dd className="font-semibold text-forest">{corners} vertices</dd>
                </div>

                {activeCoords && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                        Latitude & Longitude
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-950">
                        {formatCoordinates(activeCoords.lat, activeCoords.lng)}
                      </span>
                      <span className="font-mono text-[10px] text-blue-700/80">
                        {activeCoords.lat.toFixed(6)}, {activeCoords.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-forest/10 pt-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-forest/70">
                    <MapPin className="h-3.5 w-3.5 text-sage" />
                    <span>Location details</span>
                  </div>
                  {loadingAddress ? (
                    <dd className="text-xs text-forest/60 italic">Resolving address…</dd>
                  ) : address ? (
                    <dd className="space-y-1.5 rounded-xl bg-forest/5 p-2.5 text-xs">
                      {address.village && (
                        <div className="flex justify-between">
                          <span className="text-forest/70">Village / Town</span>
                          <span className="font-medium text-forest">{address.village}</span>
                        </div>
                      )}
                      {address.city && address.city !== address.village && (
                        <div className="flex justify-between">
                          <span className="text-forest/70">City</span>
                          <span className="font-medium text-forest">{address.city}</span>
                        </div>
                      )}
                      {address.district && (
                        <div className="flex justify-between">
                          <span className="text-forest/70">District</span>
                          <span className="font-medium text-forest">{address.district}</span>
                        </div>
                      )}
                      {address.state && (
                        <div className="flex justify-between">
                          <span className="text-forest/70">State</span>
                          <span className="font-medium text-forest">{address.state}</span>
                        </div>
                      )}
                      {address.country && (
                        <div className="flex justify-between">
                          <span className="text-forest/70">Country</span>
                          <span className="font-medium text-forest">{address.country}</span>
                        </div>
                      )}
                      {!address.village &&
                        !address.city &&
                        !address.district &&
                        !address.state &&
                        !address.country && (
                          <div className="font-medium text-forest/80">{address.formatted}</div>
                        )}
                      {activeCoords && (
                        <div className="flex justify-between border-t border-forest/10 pt-1 font-mono text-[11px]">
                          <span className="text-forest/60">GPS Centroid</span>
                          <span className="font-medium text-forest">
                            {formatCoordinates(activeCoords.lat, activeCoords.lng)}
                          </span>
                        </div>
                      )}
                    </dd>
                  ) : (
                    <dd className="text-xs text-forest/60">Location unlisted</dd>
                  )}
                </div>

                <p className="pt-1 text-xs text-forest/60">
                  Drag the corners to adjust. The area is calculated from the drawn outline.
                </p>
              </dl>
            ) : activeCoords ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                      GPS Location Acquired
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-950">
                      {formatCoordinates(activeCoords.lat, activeCoords.lng)}
                    </span>
                    <span className="font-mono text-[10px] text-blue-700/80">
                      {activeCoords.lat.toFixed(6)}, {activeCoords.lng.toFixed(6)}
                    </span>
                  </div>
                </div>

                {address && (
                  <div className="space-y-1.5 rounded-xl bg-forest/5 p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-forest">
                      <MapPin className="h-3.5 w-3.5 text-sage" />
                      <span>{address.formatted}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-forest/70">
                  Coordinates ready. Click <strong>Draw field</strong> to outline your boundary, or upload a boundary file below.
                </p>
              </div>
            ) : (
              <p className="text-sm text-forest/70">
                No field yet. Search for your location, click <strong>My location</strong>, press{" "}
                <strong>Draw field</strong>, or upload a boundary file below.
              </p>
            )}

            <div className="mt-4">
              <GeoJsonUpload onLoaded={(f) => setField(f.polygon, f.hectares)} />
            </div>
          </Card>

          <Card className="rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden">
            <h2 className="mb-4 font-semibold text-base text-forest">About your farm</h2>
            <FarmForm
              key={profile ? JSON.stringify(profile) : "empty"}
              initial={profile}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {investigating && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-900/10 dark:bg-forest-950/20 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full max-w-md rounded-3xl border border-white/50 dark:border-forest/30 bg-white/75 dark:bg-[#152019]/80 p-7 shadow-2xl backdrop-blur-2xl text-center space-y-5"
            >
              <div className="flex items-center justify-center">
                <ThinkingOrb
                  state={investigationStages[investigationStep]?.orbState ?? "working"}
                  size={76}
                  speed={1.1}
                  theme="auto"
                  className="mx-auto drop-shadow-md"
                  aria-label="Agent working"
                />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-forest/5 px-3 py-1 text-xs font-semibold text-forest dark:text-forest-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-forest" />
                  </span>
                  Step {investigationStep + 1} of {investigationStages.length}
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {investigationStages[investigationStep]?.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {investigationStages[investigationStep]?.detail}
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/80 dark:bg-stone-800/80">
                  <motion.div
                    className="h-full rounded-full bg-forest"
                    initial={{ width: "15%" }}
                    animate={{
                      width: `${((investigationStep + 1) / investigationStages.length) * 100}%`,
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  <span>Autonomous agent workflow</span>
                  <span>{Math.round(((investigationStep + 1) / investigationStages.length) * 100)}%</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
