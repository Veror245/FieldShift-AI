import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { MapPin, Sparkles } from "lucide-react"
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
import { computePolygonCentroid, reverseGeocode } from "@/utils/reverseGeocode"
import type { FarmProfile } from "@/types/farm"

export default function FieldExplorer() {
  const navigate = useNavigate()

  const { polygon, hectares, profile, setField, setProfile, ensureFarmId, setInvestigationId } =
    useFarmStore()
  const [submitting, setSubmitting] = useState(false)

  const corners = polygon ? polygon.geometry.coordinates[0].length - 1 : 0

  const coords = polygon?.geometry?.coordinates?.[0] as [number, number][] | undefined
  const [lng, lat] = coords && coords.length >= 3 ? computePolygonCentroid(coords) : [null, null]

  const { data: address, isLoading: loadingAddress } = useQuery({
    queryKey: ["reverseGeocode", lng, lat],
    queryFn: () => (lng !== null && lat !== null ? reverseGeocode(lng, lat) : null),
    enabled: Boolean(polygon && lng !== null && lat !== null),
    staleTime: 1000 * 60 * 30,
  })

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
      const request = buildInvestigationRequest({ farmId: ensureFarmId(), polygon, profile: values })
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

  return (
    <>
      <PageHeader
        title="Field Explorer"
        description="Find your land, outline your field, then tell us about your farm."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-[65vh] min-h-[420px] lg:sticky lg:top-6">
          <FieldMap polygon={polygon} onChange={setField} />
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Field boundary</h2>
              <Button variant="secondary" size="sm" onClick={loadSample} className="h-9 rounded-lg">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Load sample farm
              </Button>
            </div>

            {polygon ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-forest/70">Area</dt>
                  <dd className="font-semibold">{hectares.toFixed(2)} ha</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-forest/70">Corners</dt>
                  <dd className="font-semibold">{corners}</dd>
                </div>
                <div className="border-t border-forest/10 pt-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-forest/70">
                    <MapPin className="h-3.5 w-3.5 text-sage" />
                    <span>Location details</span>
                  </div>
                  {loadingAddress ? (
                    <dd className="text-xs text-forest/60 italic">Resolving address…</dd>
                  ) : address ? (
                    <dd className="space-y-1 rounded-xl bg-forest/5 p-2.5 text-xs">
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
                    </dd>
                  ) : (
                    <dd className="text-xs text-forest/60">Location unlisted</dd>
                  )}
                </div>
                <p className="pt-1 text-xs text-forest/60">
                  Drag the corners to adjust. The area is calculated from the drawn outline.
                </p>
              </dl>
            ) : (
              <p className="text-sm text-forest/70">
                No field yet. Search for your location, press <strong>Draw field</strong>, or upload
                a boundary file below.
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
