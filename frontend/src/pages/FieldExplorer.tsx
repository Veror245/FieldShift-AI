import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { motion } from "framer-motion"
import FieldMap from "@/maps/FieldMap"
import FarmForm from "@/components/farm/FarmForm"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { PlusIcon } from "@/components/common/Icons"
import { uiSoundEngine } from "@/utils/uiSoundEngine"
import { useFarmStore } from "@/store/useFarmStore"
import type { FarmProfile } from "@/types/farm"
import { pageContainer, pageItem } from "@/lib/motion"

export default function FieldExplorer() {
  const navigate = useNavigate()
  const { polygon, hectares, locationAddress, setField, setProfile } = useFarmStore()

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
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <motion.div variants={pageItem} className="flex items-center justify-between">
        <PageHeader
          title="Field Explorer"
          description="Find your land, outline your field boundary, then tell us about your farm."
        />
        {polygon && (
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2.5 rounded-full px-3.5 py-1.5 bg-[#DAD3C2] border border-[#C2B9A5] text-xs font-semibold text-[#2B3326] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#5E7A46] animate-pulse" />
              <span>
                Boundary active • <AnimatedNumber value={hectares} decimals={2} suffix=" ha" /> ({corners} corners)
              </span>
            </div>
            {locationAddress && (
              <span className="text-[11px] font-medium text-[#5E594F] truncate max-w-[340px]">
                📍 {locationAddress}
              </span>
            )}
          </div>
        )}
      </motion.div>

      <div className="grid gap-3.5 lg:grid-cols-[1.35fr_380px] lg:h-[calc(100vh-140px)] items-stretch">
        <motion.div variants={pageItem} className="h-[480px] lg:h-full w-full rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(35,31,24,0.10)] border-2 border-[#CFC6B2] bg-[#E8E2D4]">
          <FieldMap initialPolygon={polygon} onChange={setField} />
        </motion.div>

        <motion.div
          variants={pageItem}
          className="space-y-3 lg:overflow-y-auto lg:pr-1.5 h-full max-h-[calc(100vh-140px)]"
        >
          <Card className="rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm text-[#1E241B]">Field boundary</h2>
              {polygon && (
                <span className="rounded-full bg-[#E2DBC9] border border-[#C9C0AC] px-2.5 py-0.5 text-[11px] font-bold text-[#3B4A32]">
                  <AnimatedNumber value={hectares} decimals={2} suffix=" ha" />
                </span>
              )}
            </div>
            {polygon ? (
              <div className="space-y-2.5">
                <dl className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#666257]">Calculated area</dt>
                    <dd className="font-bold text-[#1E241B]">
                      <AnimatedNumber value={hectares} decimals={2} suffix=" ha" /> (
                      <AnimatedNumber value={hectares * 2.471} decimals={2} suffix=" acres" />)
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#666257]">Boundary corners</dt>
                    <dd className="font-bold text-[#1E241B]">
                      <AnimatedNumber value={corners} decimals={0} suffix=" vertices" />
                    </dd>
                  </div>
                  {locationAddress && (
                    <div className="flex justify-between items-start gap-2 pt-1 border-t border-[#D9D1BF]">
                      <dt className="text-[#666257] shrink-0">Field location</dt>
                      <dd className="font-semibold text-right text-[#1E241B] text-[11px] leading-snug">
                        {locationAddress}
                      </dd>
                    </div>
                  )}
                  <p className="pt-0.5 text-[11px] text-[#787367] leading-tight">
                    Drag corner points on map to adjust. Area updates live in real-time.
                  </p>
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    uiSoundEngine.playChipClickSfx()
                    window.dispatchEvent(new CustomEvent("fieldshift-resume-drawing"))
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#5E7A46] hover:bg-[#6E8F53] text-[#F7F4EC] py-2 px-3 text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add more corners to boundary
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#5C5A52] leading-relaxed">
                Click <strong className="text-[#1E241B]">Draw field</strong>, then click each corner of your land on the satellite imagery.
              </p>
            )}
          </Card>

          <Card className="rounded-2xl p-4">
            <h2 className="mb-3 font-semibold text-sm text-[#1E241B]">About your farm</h2>
            <FarmForm onSubmit={handleSubmit} />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
