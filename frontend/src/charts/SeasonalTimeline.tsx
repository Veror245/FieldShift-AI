import { useState } from "react"
import { motion } from "framer-motion"
import { visibleSegments, monthsOf } from "@/lib/calendar"
import type { SeasonalCalendar, SegmentType } from "@/types/calendar"

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const segmentMeta: Record<SegmentType, { label: string; className: string }> = {
  sowing: { label: "Sowing", className: "bg-sun text-white" },
  growth: { label: "Active growth", className: "bg-sage text-forest" },
  harvest: { label: "Harvest", className: "bg-forest text-ivory" },
  cover: { label: "Cover crop", className: "bg-emerald-600/70 text-white" },
  bare: { label: "Bare field", className: "border border-dashed border-sun text-forest/70" },
}

const stripes = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(224,142,69,0.35) 0 6px, transparent 6px 12px)",
}

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-forest/70">
      {(Object.keys(segmentMeta) as SegmentType[]).map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span
            className={`h-3 w-5 rounded ${segmentMeta[t].className.split(" ").slice(0, 3).join(" ")}`}
            style={t === "bare" ? stripes : undefined}
          />
          {segmentMeta[t].label}
        </span>
      ))}
    </div>
  )
}

type Props = { calendar: SeasonalCalendar; months: number }

export default function SeasonalTimeline({ calendar, months }: Props) {
  const [info, setInfo] = useState("Hover over or tap a bar to see its dates.")

  const cells = Array.from({ length: months }, (_, i) => {
    const total = calendar.startMonth + i
    return { name: monthNames[total % 12], year: calendar.startYear + Math.floor(total / 12) }
  })

  const years: { year: number; count: number }[] = []
  cells.forEach((c) => {
    const last = years[years.length - 1]
    if (last && last.year === c.year) last.count += 1
    else years.push({ year: c.year, count: 1 })
  })

  const dateText = (start: number, end: number) => {
    const a = cells[start]
    const b = cells[end - 1]
    return `${a.name} ${a.year} to ${b.name} ${b.year}`
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: months === 24 ? 1500 : 860 }}>
        <div className="flex">
          <div className="sticky left-0 z-10 w-40 shrink-0 bg-white" />
          <div className="flex flex-1">
            {years.map((y) => (
              <div
                key={y.year}
                style={{ width: `${(y.count / months) * 100}%` }}
                className="border-l border-forest/10 px-1 pt-1 text-xs font-semibold"
              >
                {y.year}
              </div>
            ))}
          </div>
        </div>

        <div className="flex">
          <div className="sticky left-0 z-10 w-40 shrink-0 bg-white" />
          <div className="flex flex-1">
            {cells.map((c, i) => (
              <div key={i} className="flex-1 py-1 text-center text-[11px] text-forest/60">
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {calendar.rows.map((row, ri) => {
          const segs = visibleSegments(row, months)
          const bare = monthsOf(row, "bare", months)
          const cover = monthsOf(row, "cover", months)
          return (
            <div key={row.strategyId} className="flex items-stretch border-t border-forest/10">
              <div className="sticky left-0 z-10 flex w-40 shrink-0 flex-col justify-center bg-white pr-3">
                <p className="text-sm font-semibold">{row.name}</p>
                <p className="text-[11px] text-forest/60">
                  {bare > 0 && <span className="text-sun">Bare {bare} mo</span>}
                  {bare > 0 && cover > 0 && " · "}
                  {cover > 0 && <span>Cover {cover} mo</span>}
                  {bare === 0 && cover === 0 && "No bare periods"}
                </p>
              </div>

              <div className="relative h-14 flex-1">
                <div className="absolute inset-0 flex">
                  {cells.map((_, i) => (
                    <div key={i} className="flex-1 border-l border-forest/10" />
                  ))}
                </div>

                {segs.map((s, si) => {
                  const meta = segmentMeta[s.type]
                  const text = `${meta.label}${s.crop ? ` · ${s.crop}` : ""} · ${dateText(s.start, s.end)}`
                  return (
                    <motion.button
                      key={`${row.strategyId}-${si}-${months}`}
                      type="button"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, delay: ri * 0.08 + si * 0.03 }}
                      style={{
                        left: `${(s.start / months) * 100}%`,
                        width: `${((s.end - s.start) / months) * 100}%`,
                        transformOrigin: "left",
                        ...(s.type === "bare" ? stripes : {}),
                      }}
                      className={`absolute top-3 h-8 overflow-hidden rounded-md px-1.5 text-left text-[11px] font-medium leading-8 outline-none focus-visible:ring-2 focus-visible:ring-forest ${meta.className}`}
                      title={text}
                      onMouseEnter={() => setInfo(text)}
                      onFocus={() => setInfo(text)}
                      onClick={() => setInfo(text)}
                    >
                      {s.type !== "sowing" && s.type !== "harvest" ? s.crop : ""}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <p className="mt-3 min-h-5 text-sm text-forest/80">{info}</p>
      </div>
    </div>
  )
}