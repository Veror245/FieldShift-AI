export type GlossaryKey = "ndvi" | "soilMoisture" | "rainfallAnomaly" | "organicMatter" |  "organicCarbon"

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
   organicCarbon: {
    label: "Organic carbon",
    text: "The carbon held in decomposed plant and animal material in the soil, shown as a percentage on soil test reports. More organic carbon usually means better soil structure, nutrients and water holding.",
  },
  organicMatter: {
    label: "Soil Organic Matter",
    text: "Decomposed plant and biological material in topsoil that enhances water retention and nutrient availability.",
  },
}
