import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Rocket, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Term } from "@/components/common/Term"
import { cropOptions, farmSchema, type FarmProfile } from "@/types/farm"

const inputClass =
  "h-11 w-full rounded-xl border border-forest/15 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sage"

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
      <label className="text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-forest/60">{hint}</p>}
      {error && <p className="text-xs text-sun">{error}</p>}
    </div>
  )
}

type Props = { onSubmit: (values: FarmProfile) => void }

export default function FarmForm({ onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmProfile>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-dashed border-sage bg-white/60 p-2">
              {field.value.length === 0 && (
                <span className="px-1 text-sm text-forest/50">No crops chosen yet</span>
              )}
              {field.value.map((crop, i) => (
                <button
                  key={`${crop}-${i}`}
                  type="button"
                  onClick={() => field.onChange(field.value.filter((_, idx) => idx !== i))}
                  className="flex items-center gap-1 rounded-full bg-forest px-3 py-1.5 text-sm text-ivory"
                >
                  {i + 1}. {crop}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cropOptions.map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => field.onChange([...field.value, crop])}
                  className="rounded-full border border-forest/20 bg-white px-3 py-1.5 text-xs hover:bg-sage/20"
                >
                  + {crop}
                </button>
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

      <Field label="Soil texture">
        <select {...register("soilTexture")} className={inputClass}>
          <option value="unknown">I don't know</option>
          <option value="sandy">Sandy (loose, drains fast)</option>
          <option value="loamy">Loamy (soft, crumbly)</option>
          <option value="clay">Clay (sticky, holds water)</option>
          <option value="silty">Silty (smooth, floury)</option>
        </select>
      </Field>

      <Field label="Water availability">
        <select {...register("water")} className={inputClass}>
          <option value="reliable">Reliable irrigation all season</option>
          <option value="unreliable">Irrigation, but unreliable</option>
          <option value="rainfed">Rain-fed only</option>
        </select>
      </Field>

      <div className="space-y-4">
        <p className="text-sm font-semibold">What matters most to you?</p>
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-semibold">{field.value}</span>
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

      <Button type="submit" className="h-12 w-full rounded-xl text-base">
        <Rocket className="mr-2 h-5 w-5" />
        Start investigation
      </Button>
    </form>
  )
}