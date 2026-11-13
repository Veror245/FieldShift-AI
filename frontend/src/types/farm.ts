import { z } from "zod"

export const cropOptions = [
  "Rice", "Wheat", "Maize", "Chickpea", "Mung Bean", "Mustard", "Berseem", "Cowpea",
]

export const seasonOptions = ["kharif", "rabi", "zaid"] as const

const optionalNumber = (min: number, max: number, message: string) =>
  z
    .string()
    .refine(
      (v) => v.trim() === "" || (!isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
      message
    )

const thisYear = new Date().getFullYear()

export const farmSchema = z
  .object({
    farmName: z.string().min(2, "Give your farm a name"),
    region: z.string().min(1, "Choose your region"),
    rotation: z
      .array(z.object({ crop: z.string(), season: z.enum(seasonOptions) }))
      .min(1, "Pick at least one crop, in the order you grow them"),
    rotationYear: z
      .string()
      .refine(
        (v) => /^\d{4}$/.test(v) && Number(v) >= 2000 && Number(v) <= thisYear,
        `Enter a year between 2000 and ${thisYear}`
      ),
    soilPh: optionalNumber(3, 10, "pH should be a number between 3 and 10"),
    organicCarbon: optionalNumber(0, 20, "Enter a percentage between 0 and 20"),
    soilTexture: z.enum(["unknown", "sandy", "loamy", "clay", "silty"]),
    nitrogenPpm: optionalNumber(0, 5000, "Enter a number in ppm"),
    sampledAt: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && Date.parse(v) <= Date.now()),
        "Use a date that is not in the future"
      ),
    labName: z.string(),
    water: z.enum(["reliable", "unreliable", "rainfed"]),
    waterPriority: z.number(),
    costPriority: z.number(),
    soilPriority: z.number(),
    objectives: z.string(),
    forbiddenCrops: z.array(z.string()),
    requiredCrops: z.array(z.string()),
    maxWater: z.enum(["any", "low", "medium", "high"]),
  })
  .refine((v) => !v.requiredCrops.some((c) => v.forbiddenCrops.includes(c)), {
    message: "A crop cannot be both required and excluded",
    path: ["requiredCrops"],
  })

export type FarmProfile = z.infer<typeof farmSchema>