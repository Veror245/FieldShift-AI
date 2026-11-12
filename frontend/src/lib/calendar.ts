import type { CalendarRow, CalendarSegment, SegmentType } from "@/types/calendar"

export function visibleSegments(row: CalendarRow, months: number): CalendarSegment[] {
  return row.segments
    .filter((s) => s.start < months)
    .map((s) => ({
      ...s,
      end: Math.min(months, s.end),
    }))
}

export function monthsOf(row: CalendarRow, type: SegmentType, months: number): number {
  return visibleSegments(row, months)
    .filter((s) => s.type === type)
    .reduce((sum, s) => sum + Math.max(0, s.end - s.start), 0)
}
