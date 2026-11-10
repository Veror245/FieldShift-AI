import type { ClimateFindings, ClimateSeason } from "@/types/api"

// [year, rainfall mm, mean temp °C, longest dry spell days, cluster, anomaly score]
const rows: [number, number, number, number, number, number][] = [
  [2006, 1180, 28.1, 9, 1, 0.22],
  [2007, 1420, 28.3, 5, 0, 0.31],
  [2008, 1290, 28.0, 6, 1, 0.18],
  [2009, 1050, 28.9, 14, 2, 0.66],
  [2010, 1380, 28.4, 5, 0, 0.28],
  [2011, 1310, 28.2, 6, 0, 0.2],
  [2012, 1120, 28.7, 12, 1, 0.41],
  [2013, 1450, 28.1, 4, 0, 0.38],
  [2014, 1010, 29.0, 15, 2, 0.72],
  [2015, 1240, 28.8, 8, 1, 0.3],
  [2016, 1330, 28.6, 6, 0, 0.24],
  [2017, 1400, 28.3, 5, 0, 0.27],
  [2018, 1260, 28.5, 7, 1, 0.19],
  [2019, 1150, 29.0, 11, 2, 0.58],
  [2020, 1480, 28.2, 4, 0, 0.44],
  [2021, 1300, 28.4, 6, 0, 0.21],
  [2022, 980, 29.3, 17, 2, 0.88],
  [2023, 1090, 29.1, 14, 2, 0.74],
  [2024, 1210, 28.9, 9, 1, 0.35],
  [2025, 920, 29.6, 19, 2, 0.93],
]

const seasons: ClimateSeason[] = rows.map(
  ([year, rainfallMm, meanTempC, longestDrySpellDays, cluster, anomalyScore]) => ({
    year,
    rainfallMm,
    meanTempC,
    longestDrySpellDays,
    cluster,
    anomalyScore,
    isAnomaly: anomalyScore >= 0.6,
  })
)

// DEMO DATA ONLY. These numbers are placeholders, not real NASA POWER results.
export const mockClimate: ClimateFindings = {
  location: "Selected field",
  seasonLabel: "Monsoon season (Jun to Sep)",
  seasons,
  clusters: [
    { id: 0, name: "Wet seasons", description: "Above-normal rainfall, shorter dry spells and cooler averages." },
    { id: 1, name: "Typical seasons", description: "Rainfall and temperature close to the long-term middle." },
    { id: 2, name: "Hot and dry seasons", description: "Low rainfall, long dry spells and warmer averages." },
  ],
  currentSeason: {
    label: "Current season so far",
    summary:
      "Rainfall so far is below the historical normal and temperatures are running warm. This is a pattern comparison, not a yield prediction.",
    similar: [
      { year: 2022, reason: "Similar rainfall shortfall and a long dry spell" },
      { year: 2014, reason: "Comparable warm and dry conditions" },
      { year: 2023, reason: "Similar temperature pattern" },
    ],
  },
  source: "Demo data (will come from NASA POWER)",
  resolutionNote:
    "NASA POWER uses a coarse grid of roughly 50 km, so values describe the wider area, not your exact field.",
}