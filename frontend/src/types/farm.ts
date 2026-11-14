import { z } from "zod"

export const cropOptions = [
  "Rice",
  "Wheat",
  "Maize",
  "Chickpea",
  "Mung Bean",
  "Mustard",
  "Berseem",
  "Cowpea",
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

export const prioritiesSchema = z.object({
  water_efficiency: z.number().min(0).max(1),
  soil_improvement: z.number().min(0).max(1),
  economic_potential: z.number().min(0).max(1),
  climate_compatibility: z.number().min(0).max(1),
  nitrogen_cycling: z.number().min(0).max(1),
  erosion_protection: z.number().min(0).max(1),
  crop_diversity: z.number().min(0).max(1),
  feasibility: z.number().min(0).max(1),
})

export type Priorities = z.infer<typeof prioritiesSchema>

export const defaultPriorities: Priorities = {
  water_efficiency: 0.9,
  soil_improvement: 0.8,
  economic_potential: 0.5,
  climate_compatibility: 0.7,
  nitrogen_cycling: 0.6,
  erosion_protection: 0.3,
  crop_diversity: 0.4,
  feasibility: 0.5,
}

export const priorityLabels: Record<keyof Priorities, { label: string; hint: string }> = {
  water_efficiency: {
    label: "Water efficiency",
    hint: "Conserve water demand and build drought resilience",
  },
  soil_improvement: {
    label: "Soil improvement",
    hint: "Enhance soil organic matter and structure",
  },
  economic_potential: {
    label: "Economic potential",
    hint: "Maximize market yield and crop profitability",
  },
  climate_compatibility: {
    label: "Climate compatibility",
    hint: "Resilience to heat extremes and dry spells",
  },
  nitrogen_cycling: {
    label: "Nitrogen cycling",
    hint: "Legume bio-fixation and residual nutrient boost",
  },
  erosion_protection: {
    label: "Erosion protection",
    hint: "Canopy ground cover and root retention",
  },
  crop_diversity: {
    label: "Crop diversity",
    hint: "Break weed and pest cycles across seasons",
  },
  feasibility: {
    label: "Operational feasibility",
    hint: "Familiarity with machinery, labor, and seed access",
  },
}

export const farmSchema = z
  .object({
    farmName: z.string().min(2, "Give your farm a name"),
    region: z.string(),
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
    priorities: prioritiesSchema,
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
