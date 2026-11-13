import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
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
import type { FarmProfile } from "@/types/farm"

export default function FieldExplorer() {
  const navigate = useNavigate()
  const { polygon, hectares, profile, setField, setProfile, ensureFarmId, setInvestigationId } =
    useFarmStore()
  const [submitting, setSubmitting] = useState(false)

  const corners = polygon ? polygon.geometry.coordinates[0].length - 1 : 0

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