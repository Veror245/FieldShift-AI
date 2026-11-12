import type { WatchMetric } from "@/types/watch"

export type MetricMetaItem = {
  label: string
  thresholdLabel: string
  defaultThreshold: number
  defaultWindow: number
  min: number
  max: number
  step: number
  windowMin: number
  windowMax: number
  formatThreshold: (v: number) => string
  describe: (threshold: number, windowDays: number) => string
}

export const metricOrder: WatchMetric[] = [
  "rainfall",
  "heat",
  "soilMoisture",
  "vegetation",
  "bareField",
]

export const metricMeta: Record<WatchMetric, MetricMetaItem> = {
  rainfall: {
    label: "Rainfall deficit",
    thresholdLabel: "Deficit threshold",
    defaultThreshold: 25,
    defaultWindow: 14,
    min: 10,
    max: 60,
    step: 5,
    windowMin: 7,
    windowMax: 30,
    formatThreshold: (v) => `${v}% below normal`,
    describe: (threshold, windowDays) =>
      `Alert if cumulative rainfall drops ${threshold}% below historical average across ${windowDays} days.`,
  },
  heat: {
    label: "Extreme heat days",
    thresholdLabel: "Temperature ceiling",
    defaultThreshold: 38,
    defaultWindow: 5,
    min: 32,
    max: 46,
    step: 1,
    windowMin: 3,
    windowMax: 14,
    formatThreshold: (v) => `Above ${v} °C`,
    describe: (threshold, windowDays) =>
      `Alert when maximum temperature exceeds ${threshold} °C for more than ${windowDays} consecutive days.`,
  },
  soilMoisture: {
    label: "Root-zone soil moisture",
    thresholdLabel: "Moisture minimum",
    defaultThreshold: 20,
    defaultWindow: 7,
    min: 10,
    max: 45,
    step: 5,
    windowMin: 3,
    windowMax: 21,
    formatThreshold: (v) => `Below ${v}% saturation`,
    describe: (threshold, windowDays) =>
      `Alert if root-zone moisture stays below ${threshold}% saturation for ${windowDays} days.`,
  },
  vegetation: {
    label: "NDVI vegetation drop",
    thresholdLabel: "Vigor decline",
    defaultThreshold: 15,
    defaultWindow: 10,
    min: 5,
    max: 35,
    step: 5,
    windowMin: 5,
    windowMax: 20,
    formatThreshold: (v) => `${v}% drop vs baseline`,
    describe: (threshold, windowDays) =>
      `Alert if satellite vegetation index declines ${threshold}% relative to expected growth stage over ${windowDays} days.`,
  },
  bareField: {
    label: "Uncovered bare soil",
    thresholdLabel: "Max bare duration",
    defaultThreshold: 30,
    defaultWindow: 30,
    min: 14,
    max: 60,
    step: 7,
    windowMin: 14,
    windowMax: 60,
    formatThreshold: (v) => `${v} days bare`,
    describe: (threshold, windowDays) =>
      `Alert if field canopy coverage is near zero for more than ${threshold} days in a ${windowDays}-day window.`,
  },
}
