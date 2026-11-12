import type { NewWatchRule, WatchAlert, WatchRule } from "@/types/watch"
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
let rules: WatchRule[] = [
  { id: "r1", name: "Low rainfall watch", metric: "rainfall", threshold: 20, windowDays: 30, enabled: true },
  { id: "r2", name: "Soil-moisture watch", metric: "soilMoisture", threshold: 25, windowDays: 14, enabled: true },
  { id: "r3", name: "Heat spell watch", metric: "heat", threshold: 40, windowDays: 5, enabled: false },
]
let alerts: WatchAlert[] = [
  {
    id: "a1",
    ruleName: "Soil-moisture watch",
    severity: "attention",
    title: "Soil-moisture estimates are below the historical baseline",
    summary:
      "Recent regional soil-moisture estimates are below the historical baseline. This may indicate an emerging water-stress concern. Check field-level soil moisture before making irrigation decisions.",
    dataNote:
      "Based on regional soil-moisture estimates, which are published with a delay and describe a wide area, not your exact field.",
    date: daysAgo(2),
    status: "new",
  },
  {
    id: "a2",
    ruleName: "Low rainfall watch",
    severity: "watch",
    title: "30-day rainfall is below the 20th historical percentile",
    summary:
      "Rainfall over the last 30 days is lower than in most past years for this time of season. Compare this with your own rain gauge and irrigation records before acting.",
    dataNote: "Based on daily records for the surrounding grid cell. Publication delays of a few days are normal.",
    date: daysAgo(9),
    status: "new",
  },
  {
    id: "a3",
    ruleName: "Vegetation watch",
    severity: "info",
    title: "Vegetation greenness is slightly below the seasonal norm",
    summary:
      "Greenness in the area is a little under the usual level for this point in the season. This is a small difference and may reflect normal variation.",
    dataNote: "Based on satellite vegetation indices, which are updated every few days at moderate resolution.",
    date: daysAgo(21),
    status: "reviewed",
  },
]
export const mockWatch = {
  rules: (): WatchRule[] => rules.map((r) => ({ ...r })),
  addRule: (r: NewWatchRule): WatchRule => {
    const rule: WatchRule = { ...r, id: `r${Date.now()}` }
    rules = [...rules, rule]
    return { ...rule }
  },
  updateRule: (id: string, patch: Partial<NewWatchRule>) => {
    rules = rules.map((r) => (r.id === id ? { ...r, ...patch } : r))
  },
  removeRule: (id: string) => {
    rules = rules.filter((r) => r.id !== id)
  },
  alerts: (): WatchAlert[] => alerts.map((a) => ({ ...a })),
  reviewAlert: (id: string) => {
    alerts = alerts.map((a) => (a.id === id ? { ...a, status: "reviewed" } : a))
  },
}
