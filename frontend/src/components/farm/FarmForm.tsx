import { useEffect, useRef, type ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Rocket, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Term } from "@/components/common/Term"
import { GlassSelect } from "@/components/common/GlassSelect"
import {
  cropOptions,
  farmSchema,
  seasonOptions,
  defaultPriorities,
  priorityLabels,
  type FarmProfile,
  type Priorities,
} from "@/types/farm"

const inputClass =
  "h-11 w-full box-border rounded-xl border border-forest/15 bg-white px-3.5 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-sage"

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
    <div className="space-y-1.5 w-full min-w-0">
      <label className="text-sm font-semibold text-forest block">{label}</label>
      <div className="w-full min-w-0">{children}</div>
      {hint && !error && <p className="text-xs text-forest/60 leading-relaxed">{hint}</p>}
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
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs transition-colors ${
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

function PriorityCard({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const step = 0.05
      const delta = e.deltaY < 0 ? step : -step
      const next = Math.min(1, Math.max(0, Number((value + delta).toFixed(2))))
      onChange(next)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [value, onChange])

  return (
    <div
      ref={cardRef}
      className="group select-none flex flex-col justify-between rounded-xl border border-forest/12 bg-white/80 p-2 shadow-xs transition-all hover:border-forest/35 hover:bg-white min-w-0"
      title="Scroll mouse wheel here to adjust value without scrolling the page"
    >
      <div className="flex items-center justify-between gap-1 text-xs">
        <span className="font-semibold text-forest truncate text-[11px] leading-tight">{label}</span>
        <span className="rounded bg-[#EAF1E7] border border-[#BACBB0] px-1.5 py-0.2 font-mono text-[10.5px] font-bold text-[#2E4221] shrink-0">
          {value.toFixed(2)}
        </span>
      </div>
      <p className="my-0.5 text-[10px] text-forest/60 truncate leading-none">{hint}</p>
      <Slider
        value={[Math.round(value * 100)]}
        onValueChange={(v) => onChange(Number((v[0] / 100).toFixed(2)))}
        min={0}
        max={100}
        step={5}
        className="py-0.5 cursor-pointer"
      />
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
      region: "punjab_in",
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
      priorities: defaultPriorities,
      objectives: "",
      forbiddenCrops: [],
      requiredCrops: [],
      maxWater: "any",
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
                  <div className="w-36">
                    <GlassSelect
                      value={entry.season}
                      onChange={(val) =>
                        field.onChange(
                          field.value.map((r, idx) =>
                            idx === i
                              ? { ...r, season: val as (typeof seasonOptions)[number] }
                              : r
                          )
                        )
                      }
                      className="h-9 w-full box-border rounded-lg border border-forest/15 bg-white px-2.5 text-xs text-forest flex items-center justify-between shadow-xs outline-none focus:ring-1 focus:ring-sage transition-all text-left"
                      options={seasonOptions.map((s) => ({
                        value: s,
                        label: seasonLabel[s],
                      }))}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.crop}`}
                    onClick={() => field.onChange(field.value.filter((_, idx) => idx !== i))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-forest/10"
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
        <Controller
          control={control}
          name="soilTexture"
          render={({ field }) => (
            <GlassSelect
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "unknown", label: "I don't know" },
                { value: "sandy", label: "Sandy (loose, drains fast)" },
                { value: "loamy", label: "Loamy (soft, crumbly)" },
                { value: "clay", label: "Clay (sticky, holds water)" },
                { value: "silty", label: "Silty (smooth, floury)" },
              ]}
            />
          )}
        />
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
        <Controller
          control={control}
          name="water"
          render={({ field }) => (
            <GlassSelect
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "reliable", label: "Reliable irrigation all season" },
                { value: "unreliable", label: "Irrigation, but unreliable" },
                { value: "rainfed", label: "Rain-fed only" },
              ]}
            />
          )}
        />
      </Field>

      <Field
        label="Your situation and goals (optional)"
        hint="In your own words. For example: water has become unreliable and I want healthier soil without big risks."
      >
        <textarea
          {...register("objectives")}
          rows={3}
          className="w-full rounded-xl border border-forest/15 bg-white p-3 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-sage"
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
          <Controller
            control={control}
            name="maxWater"
            render={({ field }) => (
              <GlassSelect
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "any", label: "No limit" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            )}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Evaluation priorities</p>
          <p className="text-xs text-forest/60">
            Set weights between 0.0 and 1.0. Scroll mouse wheel over cards to adjust without page scrolling.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(priorityLabels) as (keyof Priorities)[]).map((key) => {
            const info = priorityLabels[key]
            return (
              <Controller
                key={key}
                control={control}
                name={`priorities.${key}`}
                render={({ field }) => (
                  <PriorityCard
                    label={info.label}
                    hint={info.hint}
                    value={field.value ?? defaultPriorities[key]}
                    onChange={(v) => field.onChange(v)}
                  />
                )}
              />
            )
          })}
        </div>
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
