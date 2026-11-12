import type { Strategy } from "@/types/api"

export type SegmentType = "sowing" | "growth" | "harvest" | "cover" | "bare"

export type CalendarSegment = {
  type: SegmentType
  start: number // month index from the start of the horizon (0 = first month)
  end: number // exclusive
  crop?: string
}

export type CalendarRow = {
  strategyId: string
  name: string
  kind: Strategy["kind"]
  segments: CalendarSegment[]
}

export type SeasonalCalendar = {
  startMonth: number // 0 = January
  startYear: number
  months: number
  rows: CalendarRow[]
  source: string
}