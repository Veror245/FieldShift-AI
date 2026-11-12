import { mockStrategies } from "@/mocks/strategies"
import type { CalendarSegment, SeasonalCalendar } from "@/types/calendar"

const seg = (
  type: CalendarSegment["type"],
  start: number,
  end: number,
  crop?: string
): CalendarSegment => ({ type, start, end, crop })

const twoYears = (segments: CalendarSegment[]): CalendarSegment[] => [
  ...segments,
  ...segments.map((s) => ({ ...s, start: s.start + 12, end: s.end + 12 })),
]

// DEMO DATA ONLY. Placeholder timings (month 0 = June), not verified regional planting windows.
const pattern: Record<string, CalendarSegment[]> = {
  a: [
    seg("sowing", 0, 1, "Rice"),
    seg("growth", 1, 4, "Rice"),
    seg("harvest", 4, 5, "Rice"),
    seg("sowing", 5, 6, "Wheat"),
    seg("growth", 6, 10, "Wheat"),
    seg("harvest", 10, 11, "Wheat"),
    seg("bare", 11, 12),
  ],
  b: [
    seg("sowing", 0, 1, "Soybean"),
    seg("growth", 1, 4, "Soybean"),
    seg("harvest", 4, 5, "Soybean"),
    seg("sowing", 5, 6, "Wheat"),
    seg("growth", 6, 9, "Wheat"),
    seg("harvest", 9, 10, "Wheat"),
    seg("cover", 10, 12, "Green manure"),
  ],
  c: [
    seg("sowing", 0, 1, "Millet"),
    seg("growth", 1, 3, "Millet"),
    seg("harvest", 3, 4, "Millet"),
    seg("sowing", 4, 5, "Chickpea"),
    seg("growth", 5, 8, "Chickpea"),
    seg("harvest", 8, 9, "Chickpea"),
    seg("bare", 9, 12, "Fallow"),
  ],
  d: [
    seg("sowing", 0, 1, "Groundnut"),
    seg("growth", 1, 4, "Groundnut"),
    seg("harvest", 4, 5, "Groundnut"),
    seg("sowing", 5, 6, "Mustard"),
    seg("growth", 6, 9, "Mustard"),
    seg("harvest", 9, 10, "Mustard"),
    seg("bare", 10, 12),
  ],
}

export const mockCalendar: SeasonalCalendar = {
  startMonth: 5,
  startYear: 2027,
  months: 24,
  rows: mockStrategies.map((s) => ({
    strategyId: s.id,
    name: s.name,
    kind: s.kind,
    segments: twoYears(pattern[s.id] ?? []),
  })),
  source: "Demo data (will come from the planner and the crop knowledge base)",
}