export type WatchMetric = "rainfall" | "heat" | "soilMoisture" | "vegetation" | "bareField"

export type WatchRule = {
  id: string
  name: string
  metric: WatchMetric
  threshold: number
  windowDays: number
  enabled: boolean
}

export type NewWatchRule = Omit<WatchRule, "id">

export type AlertSeverity = "info" | "watch" | "attention"

export type WatchAlert = {
  id: string
  ruleName: string
  severity: AlertSeverity
  title: string
  summary: string
  dataNote: string
  date: string
  status: "new" | "reviewed"
}