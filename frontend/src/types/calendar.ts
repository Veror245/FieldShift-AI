import type { Strategy } from "@/types/api"
export type SegmentType = "sowing" | "growth" | "harvest" | "cover" | "bare"
export type CalendarSegment = {
  type: SegmentType
  start: number 
  end: number 
  crop?: string
}
export type CalendarRow = {
  strategyId: string
  name: string
  kind: Strategy["kind"]
  segments: CalendarSegment[]
}
export type SeasonalCalendar = {
  startMonth: number 
  startYear: number
  months: number
  rows: CalendarRow[]
  source: string
}
