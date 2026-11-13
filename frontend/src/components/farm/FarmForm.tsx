import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Rocket, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Term } from "@/components/common/Term"
import { regions } from "@/lib/regions"
import { cropOptions, farmSchema, seasonOptions, type FarmProfile } from "@/types/farm"

const inputClass =
  "h-11 w-full rounded-xl border border-forest/15 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sage"

const seasonLabel: Record<(typeof seasonOptions)[number], string> = {
  kharif: "Kharif",
  rabi: "Rabi",
  zaid: "Zaid (summer)",
}

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

function CropToggle({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {cropOptions.map((crop) => {
        const on = value.includes(crop)
        return (
          <button
            key={crop}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((c) => c !== crop) : [...value, crop])}
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs ${
              on ? "border-forest bg-forest text-ivory" : "border-forest/20 bg-white hover:bg-sage/20"
            }`}
          >
            {crop}
          </button>
        )
      })}
    </div>
  )
}

type Props = {
  onSubmit: (values: FarmProfile) => void
  initial?: FarmProfile | null
  submitting?: boolean
}

export default function FarmForm({ onSubmit, initial, submitting = false }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmProfile>({
    resolver: zodResolver(farmSchema),
    defaultValues: initial ?? {
      farmName: "",
      region: regions[0].id,
      rotation: [],
      rotationYear: String(new Date().getFullYear() - 1),
      soilPh: "",
      organicCarbon: "",
      soilTexture: "unknown",
      nitrogenPpm: "",
      sampledAt: "",
      labName: "",
      water: "unreliable",
      waterPriority: 60,
      costPriority: 40,
      soilPriority: 70,
      objectives: "",
      forbiddenCrops: [],
      requiredCrops: [],
      maxWater: "any",
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

      <Field label="Region" error={errors.region?.message}>
        <select {...register("region")} className={inputClass}>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      <Controller
        control={control}
        name="rotation"
        render={({ field }) => (
          <Field
            label="Current crop rotation"
            hint="Tap crops in the order you grow them, then check each season. Kharif = monsoon crops, Rabi = winter crops, Zaid = summer crops."
            error={errors.rotation?.message}
          >
            <div className="space-y-2">
              {field.value.length === 0 && (
                <p className="rounded-xl border border-dashed border-sage p-3 text-sm text-forest/50">
                  No crops chosen yet
                </p>
              )}
              {field.value.map((entry, i) => (
                <div
                  key={`${entry.crop}-${i}`}
                  className="flex items-center gap-2 rounded-xl bg-forest/5 p-2"
                >
                  <span className="flex-1 pl-1 text-sm font-semibold">
                    {i + 1}. {entry.crop}
                  </span>
                  <select
                    aria-label={`Season for ${entry.crop}`}
                    value={entry.season}
                    onChange={(e) =>
                      field.onChange(
                        field.value.map((r, idx) =>
                          idx === i
                            ? { ...r, season: e.target.value as (typeof seasonOptions)[number] }
                            : r
                        )
                      )
                    }
                    className="h-10 rounded-lg border border-forest/15 bg-white px-2 text-sm"
                  >
                    {seasonOptions.map((s) => (
                      <option key={s} value={s}>
                        {seasonLabel[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.crop}`}
                    onClick={() => field.onChange(field.value.filter((_, idx) => idx !== i))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-forest/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {cropOptions.map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() =>
                    field.onChange([
                      ...field.value,
                      { crop, season: seasonOptions[field.value.length % seasonOptions.length] },
                    ])
                  }
                  className="min-h-9 rounded-full border border-forest/20 bg-white px-3 py-1.5 text-xs hover:bg-sage/20"
                >
                  + {crop}
                </button>
              ))}
            </div>
          </Field>
        )}
      />

      <Field
        label="Year of the most recent cycle"
        hint="The year these crops were last grown, for example 2025."
        error={errors.rotationYear?.message}
      >
        <input {...register("rotationYear")} inputMode="numeric" className={inputClass} />
      </Field>

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
          label={<Term k="organicCarbon">Organic carbon %</Term>}
          error={errors.organicCarbon?.message}
          hint="Blank = I don't know"
        >
          <input
            {...register("organicCarbon")}
            inputMode="decimal"
            placeholder="e.g. 0.5"
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

      <details className="rounded-xl border border-forest/10 p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Lab test details (optional)
        </summary>
        <div className="mt-3 space-y-4">
          <Field label="Nitrogen (ppm)" error={errors.nitrogenPpm?.message}>
            <input
              {...register("nitrogenPpm")}
              inputMode="decimal"
              placeholder="e.g. 180"
              className={inputClass}
            />
          </Field>
          <Field
            label="Date of the soil test"
            error={errors.sampledAt?.message}
            hint="Recent lab results are trusted more than general soil maps."
          >
            <input type="date" {...register("sampledAt")} className={inputClass} />
          </Field>
          <Field label="Lab name">
            <input {...register("labName")} className={inputClass} />
          </Field>
        </div>
      </details>

      <Field label="Water availability">
        <select {...register("water")} className={inputClass}>
          <option value="reliable">Reliable irrigation all season</option>
          <option value="unreliable">Irrigation, but unreliable</option>
          <option value="rainfed">Rain-fed only</option>
        </select>
      </Field>

      <Field
        label="Your situation and goals (optional)"
        hint="In your own words. For example: water has become unreliable and I want healthier soil without big risks."
      >
        <textarea
          {...register("objectives")}
          rows={3}
          className="w-full rounded-xl border border-forest/15 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-sage"
        />
      </Field>

      <div className="space-y-4">
        <p className="text-sm font-semibold">Your limits</p>

        <Controller
          control={control}
          name="forbiddenCrops"
          render={({ field }) => (
            <Field label="Crops you do not want to grow">
              <CropToggle value={field.value} onChange={field.onChange} />
            </Field>
          )}
        />

        <Controller
          control={control}
          name="requiredCrops"
          render={({ field }) => (
            <Field label="Crops you want to include" error={errors.requiredCrops?.message}>
              <CropToggle value={field.value} onChange={field.onChange} />
            </Field>
          )}
        />

        <Field label="Maximum water demand">
          <select {...register("maxWater")} className={inputClass}>
            <option value="any">No limit</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>

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

      <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl text-base">
        {submitting ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Rocket className="mr-2 h-5 w-5" />
        )}
        {submitting ? "Starting…" : "Start investigation"}
      </Button>
    </form>
  )
}