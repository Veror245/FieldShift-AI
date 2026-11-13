import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, Code2, Copy, FileText, MapPin, Sparkles } from "lucide-react"
import FieldMap from "@/maps/FieldMap"
import FarmForm from "@/components/farm/FarmForm"
import GeoJsonUpload from "@/components/farm/GeoJsonUpload"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { demoFarm } from "@/mocks/demoFarm"
import { buildInvestigationRequest } from "@/lib/investigationRequest"
import { startInvestigation } from "@/services/api"
import { useFarmStore } from "@/store/useFarmStore"
import {
  computePolygonCentroid,
  formatCoordinates,
  reverseGeocode,
  type GeocodedAddress,
} from "@/utils/reverseGeocode"
import { exportFieldPdf, buildFieldLocationJson } from "@/utils/exportFieldPdf"
import type { FarmProfile } from "@/types/farm"

export default function FieldExplorer() {
  const navigate = useNavigate()

  const { polygon, hectares, profile, setField, setProfile, ensureFarmId, setInvestigationId, weights } =
    useFarmStore()
  const [submitting, setSubmitting] = useState(false)
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; address?: GeocodedAddress } | null>(null)
  const [copiedCoords, setCopiedCoords] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [showJsonPreview, setShowJsonPreview] = useState(false)

  const corners = polygon ? polygon.geometry.coordinates[0].length - 1 : 0

  const coords = polygon?.geometry?.coordinates?.[0] as [number, number][] | undefined
  const [centroidLng, centroidLat] = coords && coords.length >= 3 ? computePolygonCentroid(coords) : [null, null]

  const { data: queryAddress, isLoading: loadingAddress } = useQuery({
    queryKey: ["reverseGeocode", centroidLng, centroidLat],
    queryFn: () => (centroidLng !== null && centroidLat !== null ? reverseGeocode(centroidLng, centroidLat) : null),
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

  const handleCopyCoords = useCallback(() => {
    if (!activeCoords) return
    const text = `${formatCoordinates(activeCoords.lat, activeCoords.lng)} (${activeCoords.lat.toFixed(6)}, ${activeCoords.lng.toFixed(6)})`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCoords(true)
      toast.success("Coordinates copied to clipboard")
      setTimeout(() => setCopiedCoords(false), 2000)
    })
  }, [activeCoords])

  const handleCopyJson = useCallback(() => {
    const jsonStr = buildFieldLocationJson({
      farmName: profile?.farmName,
      polygon,
      hectares,
      coordinates: activeCoords,
      address,
    })
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopiedJson(true)
      toast.success("Location JSON copied to clipboard")
      setTimeout(() => setCopiedJson(false), 2000)
    })
  }, [profile, polygon, hectares, activeCoords, address])

  const handleExportPdf = useCallback(() => {
    if (!activeCoords && !polygon) {
      toast.error("Please locate your position or map a field first.")
      return
    }
    const success = exportFieldPdf({
      farmName: profile?.farmName,
      polygon,
      hectares,
      coordinates: activeCoords,
      address,
    })
    if (success) {
      toast.success("Opening printable PDF report...")
    } else {
      toast.error("Pop-up blocked. Please allow pop-ups for this site to export PDF.")
    }
  }, [profile, polygon, hectares, activeCoords, address])

  const loadSample = () => {
    setField(demoFarm.polygon, demoFarm.hectares)
    setProfile(demoFarm.profile)
    toast.success("Sample farm loaded. This is example data, not a real farm.")
  }

  const handleSubmit = async (values: FarmProfile) => {
    if (!polygon) {
      toast.error("Please draw your field on the map first.")
      return
    }
    setSubmitting(true)
    try {
      const request = buildInvestigationRequest({ farmId: ensureFarmId(), polygon, profile: values, weights })
      if (import.meta.env.DEV) console.info("Investigation request:", request)
      const { investigationId } = await startInvestigation(request)
      setProfile(values)
      setInvestigationId(investigationId)
      toast.success("Farm details saved. Starting the investigation.")
      navigate("/investigation")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the investigation.")
    } finally {
      setSubmitting(false)
    }
  }

  const jsonSnippet = buildFieldLocationJson({
    farmName: profile?.farmName,
    polygon,
    hectares,
    coordinates: activeCoords,
    address,
  })

  return (
    <>
      <PageHeader
        title="Field Explorer"
        description="Find your land, outline your field, then tell us about your farm."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        <div className="h-[65vh] min-h-[420px] lg:sticky lg:top-6">
          <FieldMap
            polygon={polygon}
            onChange={setField}
            onLocationFound={handleLocationFound}
          />
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Field boundary</h2>
              <Button variant="secondary" size="sm" onClick={loadSample} className="h-9 rounded-lg">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Load sample farm
              </Button>
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
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5">
                    <div className="flex items-center justify-between gap-2">
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
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyCoords}
                        className="h-8 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-medium text-blue-900 shadow-sm hover:bg-blue-50"
                        title="Copy coordinates to clipboard"
                      >
                        {copiedCoords ? (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
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
                      {!address.village && !address.city && !address.district && !address.state && !address.country && (
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

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-forest/10">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyJson}
                    className="h-8 rounded-lg text-xs font-semibold"
                  >
                    {copiedJson ? (
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Code2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Copy JSON
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleExportPdf}
                    className="h-8 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Export as PDF
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowJsonPreview((v) => !v)}
                    className="text-[11px] text-forest/60 underline hover:text-forest ml-auto"
                  >
                    {showJsonPreview ? "Hide JSON" : "View JSON"}
                  </button>
                </div>

                {showJsonPreview && (
                  <pre className="max-h-48 overflow-auto rounded-lg bg-forest/90 p-2.5 font-mono text-[10px] text-ivory">
                    {jsonSnippet}
                  </pre>
                )}

                <p className="pt-1 text-xs text-forest/60">
                  Drag the corners to adjust. The area is calculated from the drawn outline.
                </p>
              </dl>
            ) : activeCoords ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
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
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyCoords}
                      className="h-8 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-medium text-blue-900 shadow-sm hover:bg-blue-50"
                      title="Copy coordinates to clipboard"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
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

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-forest/10">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyJson}
                    className="h-8 rounded-lg text-xs font-semibold"
                  >
                    {copiedJson ? (
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Code2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Copy JSON
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleExportPdf}
                    className="h-8 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Export as PDF
                  </Button>
                </div>

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

          <Card className="rounded-2xl p-5">
            <h2 className="mb-4 font-semibold">About your farm</h2>
            <FarmForm
              key={profile ? JSON.stringify(profile) : "empty"}
              initial={profile}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </Card>
        </div>
      </div>
    </>
  )
}
