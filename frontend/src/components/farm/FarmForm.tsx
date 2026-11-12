import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { RocketIcon, CloseIcon } from "@/components/common/Icons"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Term } from "@/components/common/Term"
import { GlassSelect } from "@/components/common/GlassSelect"
import { cropOptions, farmSchema, type FarmProfile } from "@/types/farm"
import { playChipClickSfx } from "@/utils/uiSoundEngine"

const inputClass =
  "h-11 w-full rounded-xl border border-[#C8BFA9] bg-[#E8E2D4] px-3.5 text-xs text-[#1E241B] placeholder-[#857F72] outline-none focus:border-[#63784E] focus:ring-2 focus:ring-[#63784E]/20 transition-all shadow-sm"

const soilOptions = [
  { value: "unknown", label: "I don't know" },
  { value: "sandy", label: "Sandy (loose, drains fast)" },
  { value: "loamy", label: "Loamy (soft, crumbly)" },
  { value: "clay", label: "Clay (sticky, holds water)" },
  { value: "silty", label: "Silty (smooth, floury)" },
]

const waterOptions = [
  { value: "reliable", label: "Reliable irrigation all season" },
  { value: "unreliable", label: "Irrigation, but unreliable" },
  { value: "rainfed", label: "Rain-fed only" },
]

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: ReactNode
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[#1E241B]">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#787367]">{hint}</p>}
      {error && <p className="text-[11px] text-[#A66843] font-medium">{error}</p>}
    </div>
  )
}

type Props = { onSubmit: (values: FarmProfile) => void; initial?: FarmProfile | null }

export default function FarmForm({ onSubmit, initial }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmProfile>({
    resolver: zodResolver(farmSchema),
     defaultValues: initial ?? {
      farmName: "",
      rotation: [],
      soilPh: "",
      soilTexture: "unknown",
      organicMatter: "",
      water: "unreliable",
      waterPriority: 60,
      costPriority: 40,
      soilPriority: 70,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Farm name" error={errors.farmName?.message}>
        <input
          {...register("farmName")}
          placeholder="e.g. Das family farm"
          className={inputClass}
        />
      </Field>

      <Controller
        control={control}
        name="rotation"
        render={({ field }) => (
          <Field
            label="Current crop rotation"
            hint="Tap crops in the order you grow them. Tap a chosen crop to remove it."
            error={errors.rotation?.message}
          >
            <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-[#C8BFA9] bg-[#E8E2D4]/70 p-2">
              {field.value.length === 0 && (
                <span className="px-1 text-xs text-[#857F72]">No crops chosen yet</span>
              )}
              {field.value.map((crop, i) => (
                <motion.button
                  key={`${crop}-${i}`}
                  type="button"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => {
                    playChipClickSfx()
                    field.onChange(field.value.filter((_, idx) => idx !== i))
                  }}
                  className="flex items-center gap-1 rounded-full bg-[#4E633D] px-2.5 py-1 text-xs font-bold text-[#F7F4EC] border border-[#3E5030] shadow-sm transition-transform hover:scale-105"
                >
                  {i + 1}. {crop}
                  <CloseIcon className="h-3 w-3" />
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cropOptions.map((crop, idx) => (
                <motion.button
                  key={crop}
                  type="button"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  onClick={() => {
                    playChipClickSfx()
                    field.onChange([...field.value, crop])
                  }}
                  className="rounded-full border border-[#C9C0AC] bg-[#E5DFD0] px-2.5 py-1 text-[11px] font-medium text-[#2F362B] hover:bg-[#DBD3C1] hover:border-[#B3A892] hover:-translate-y-px transition-all shadow-sm"
                >
                  + {crop}
                </motion.button>
              ))}
            </div>
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Soil pH" error={errors.soilPh?.message} hint="Blank = I don't know">
          <input
            {...register("soilPh")}
            inputMode="decimal"
            placeholder="e.g. 6.5"
            className={inputClass}
          />
        </Field>
        <Field
          label={<Term k="organicMatter">Organic matter %</Term>}
          error={errors.organicMatter?.message}
          hint="Blank = I don't know"
        >
          <input
            {...register("organicMatter")}
            inputMode="decimal"
            placeholder="e.g. 1.2"
            className={inputClass}
          />
        </Field>
      </div>

      <Controller
        control={control}
        name="soilTexture"
        render={({ field }) => (
          <Field label="Soil texture">
            <GlassSelect
              value={field.value}
              options={soilOptions}
              onChange={field.onChange}
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="water"
        render={({ field }) => (
          <Field label="Water availability">
            <GlassSelect
              value={field.value}
              options={waterOptions}
              onChange={field.onChange}
            />
          </Field>
        )}
      />

      <div className="space-y-3.5 pt-1">
        <p className="text-xs font-semibold text-[#1E241B]">What matters most to you? (Scroll or drag)</p>
        {(
          [
            ["waterPriority", "Save water"],
            ["costPriority", "Keep costs low"],
            ["soilPriority", "Improve soil health"],
          ] as const
        ).map(([name, label]) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#1E241B]">
                  <span className="font-medium text-[#666257]">{label}</span>
                  <span className="font-bold font-mono text-[#4E633D]">{field.value}</span>
                </div>
                <Slider
                  value={[field.value]}
                  onValueChange={(v) => field.onChange(v[0])}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            )}
          />
        ))}
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all"
      >
        <RocketIcon className="mr-2 h-4 w-4" />
        Start investigation
      </Button>
    </form>
  )
}
