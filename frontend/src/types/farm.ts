import { z } from "zod"

export const cropOptions = [
  "Rice", "Wheat", "Maize", "Jute", "Potato", "Mustard", "Chickpea",
  "Lentil", "Soybean", "Sorghum", "Millet", "Groundnut", "Cotton",
  "Sugarcane", "Vegetables", "Fallow",
]

export const farmSchema = z.object({
  farmName: z.string().min(2, "Give your farm a name"),
  rotation: z.array(z.string()).min(1, "Pick at least one crop, in the order you grow them"),
  soilPh: z.string().refine(
    (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 3 && Number(v) <= 10),
    "pH should be a number between 3 and 10"
  ),
  soilTexture: z.enum(["unknown", "sandy", "loamy", "clay", "silty"]),
  organicMatter: z.string().refine(
    (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 20),
    "Enter a percentage between 0 and 20"
  ),
  water: z.enum(["reliable", "unreliable", "rainfed"]),
  waterPriority: z.number(),
  costPriority: z.number(),
  soilPriority: z.number(),
})

export type FarmProfile = z.infer<typeof farmSchema>