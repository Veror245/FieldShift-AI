import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import FieldMap from "@/maps/FieldMap"
import FarmForm from "@/components/farm/FarmForm"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { useFarmStore } from "@/store/useFarmStore"
import type { FarmProfile } from "@/types/farm"

export default function FieldExplorer() {
  const navigate = useNavigate()
  const { polygon, hectares, setField, setProfile } = useFarmStore()

  const corners = polygon ? polygon.geometry.coordinates[0].length - 1 : 0

  const handleSubmit = (values: FarmProfile) => {
    if (!polygon) {
      toast.error("Please draw your field on the map first.")
      return
    }
    setProfile(values)
    toast.success("Farm details saved. Starting the investigation.")
    navigate("/investigation")
  }

  return (
    <>
      <PageHeader
        title="Field Explorer"
        description="Find your land, outline your field, then tell us about your farm."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-[65vh] min-h-[420px] lg:sticky lg:top-6">
          <FieldMap onChange={setField} />
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl p-5">
            <h2 className="mb-3 font-semibold">Field boundary</h2>
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
                <p className="pt-2 text-xs text-forest/60">
                  Drag the corners to adjust. The area is calculated from the drawn outline.
                </p>
              </dl>
            ) : (
              <p className="text-sm text-forest/70">
                No field drawn yet. Search for your location, press{" "}
                <strong>Draw field</strong>, and click the corners of your field.
              </p>
            )}
          </Card>

          <Card className="rounded-2xl p-5">
            <h2 className="mb-4 font-semibold">About your farm</h2>
            <FarmForm onSubmit={handleSubmit} />
          </Card>
        </div>
      </div>
    </>
  )
}