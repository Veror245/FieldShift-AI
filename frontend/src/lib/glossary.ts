export type GlossaryKey = "ndvi" | "soilMoisture" | "rainfallAnomaly" | "organicMatter"

export interface GlossaryEntry {
  label: string
  text: string
}

export const glossary: Record<GlossaryKey, GlossaryEntry> = {
  ndvi: {
    label: "NDVI (Vegetation Index)",
    text: "Normalized Difference Vegetation Index measures plant greenness and canopy health from satellite surface reflectance.",
  },
  soilMoisture: {
    label: "Soil Moisture",
    text: "The volumetric water content retained in the topsoil root zone, derived from satellite radar and microwave sensors.",
  },
  rainfallAnomaly: {
    label: "Rainfall Anomaly",
    text: "Significant deviations in seasonal precipitation compared to the historical 10-year local average.",
  },
  organicMatter: {
    label: "Soil Organic Matter",
    text: "Decomposed plant and biological material in topsoil that enhances water retention and nutrient availability.",
  },
}
