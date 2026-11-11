import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { motion, type Variants } from "framer-motion"
import FieldMap from "@/maps/FieldMap"
import FarmForm from "@/components/farm/FarmForm"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { PlusIcon } from "@/components/common/Icons"
import { uiSoundEngine } from "@/utils/uiSoundEngine"
import { useFarmStore } from "@/store/useFarmStore"
import type { FarmProfile } from "@/types/farm"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
}

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <PageHeader
          title="Field Explorer"
          description="Find your land, outline your field boundary, then tell us about your farm."
        />
        {polygon && (
          <div className="hidden sm:flex items-center gap-2.5 rounded-full px-3.5 py-1.5 bg-[#DAD3C2] border border-[#C2B9A5] text-xs font-semibold text-[#2B3326] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#5E7A46] animate-pulse" />
            <span>
              Boundary active • <AnimatedNumber value={hectares} decimals={2} suffix=" ha" /> ({corners} corners)
            </span>
          </div>
        )}
      </motion.div>

      <div className="grid gap-3.5 lg:grid-cols-[1.35fr_380px] lg:h-[calc(100vh-140px)] items-stretch">
        <motion.div variants={itemVariants} className="h-[480px] lg:h-full w-full rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(35,31,24,0.10)] border-2 border-[#CFC6B2] bg-[#E8E2D4]">
          <FieldMap initialPolygon={polygon} onChange={setField} />
        </motion.div>

        <motion.div
          variants={itemVariants}
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
