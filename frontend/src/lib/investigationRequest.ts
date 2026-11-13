import { z } from "zod"
import type { FarmProfile } from "@/types/farm"
import type { FieldPolygon } from "@/types/geojson"

const unit = z.number().min(0).max(1)

// This matches the JSON structure the backend team sent.
export const investigationRequestSchema = z.object({
  farm_id: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  region: z.string().min(1),
  current_rotation: z
    .array(
      z.object({
        crop_id: z.string().min(1),
        season: z.string().min(1),
        year: z.number().int().min(2000).max(2100),
      })
    )
    .min(1),
  soil_inputs: z.object({
    ph: z.number().nullable(),
    organic_carbon_pct: z.number().nullable(),
    texture: z.string(),
    nitrogen_ppm: z.number().optional(),
    sampled_at: z.string().optional(),
    lab_name: z.string().optional(),
  }),
  objectives: z.string().min(1),
  priorities: z.object({
    water_efficiency: unit,
    soil_improvement: unit,
    economic_potential: unit,
    climate_compatibility: unit,
    nitrogen_cycling: unit,
    erosion_protection: unit,
    crop_diversity: unit,
    feasibility: unit,
  }),
  constraints: z.object({
    forbidden_crops: z.array(z.string()),
    required_crops: z.array(z.string()),
    max_water_requirement: z.enum(["low", "medium", "high"]).nullable(),
  }),
})

export type InvestigationRequest = z.infer<typeof investigationRequestSchema>
export type BackendPriorities = InvestigationRequest["priorities"]

// Check these words with the backend team and edit them here if they differ.
const textureId: Record<FarmProfile["soilTexture"], string> = {
  unknown: "unknown",
  sandy: "sand",
  loamy: "loam",
  clay: "clay",
  silty: "silt",
}

const waterText: Record<FarmProfile["water"], string> = {
  reliable: "Irrigation is reliable all season.",
  unreliable: "Water availability has become unreliable.",
  rainfed: "The farm is rain-fed only.",
}

const cropId = (c: string) => c.trim().toLowerCase().replace(/\s+/g, "_")
const num = (v: string) => (v.trim() === "" ? null : Number(v))
const round = (n: number) => Number(n.toFixed(5))
const toUnit = (n: number) => Math.round(Math.max(0, Math.min(100, n))) / 100

export function polygonCentroid(polygon: FieldPolygon): { lat: number; lon: number } {
  const ring = polygon.geometry.coordinates[0]
  let a = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i]
    const [x1, y1] = ring[i + 1]
    const f = x0 * y1 - x1 * y0
    a += f
    cx += (x0 + x1) * f
    cy += (y0 + y1) * f
  }
  if (Math.abs(a) < 1e-12) {
    const pts = ring.slice(0, -1)
    return {
      lon: pts.reduce((s, p) => s + p[0], 0) / pts.length,
      lat: pts.reduce((s, p) => s + p[1], 0) / pts.length,
    }
  }
  a /= 2
  return { lon: cx / (6 * a), lat: cy / (6 * a) }
}

// TEMPORARY MAPPING. The form has 3 sliders but the backend takes 8 priorities.
// - "Save water"           -> water_efficiency
// - "Improve soil health"  -> soil_improvement, nitrogen_cycling, erosion_protection
// - "Keep costs low"       -> economic_potential, feasibility
// - climate_compatibility and crop_diversity have no slider yet, so they are sent as 0.5 (neutral).
// Replace this with 8 real sliders once the team agrees on the priorities UI.
export function prioritiesFromProfile(p: FarmProfile): BackendPriorities {
  const water = toUnit(p.waterPriority)
  const soil = toUnit(p.soilPriority)
  const cost = toUnit(p.costPriority)
  return {
    water_efficiency: water,
    soil_improvement: soil,
    nitrogen_cycling: soil,
    erosion_protection: soil,
    economic_potential: cost,
    feasibility: cost,
    climate_compatibility: 0.5,
    crop_diversity: 0.5,
  }
}

export function buildInvestigationRequest(args: {
  farmId: string
  polygon: FieldPolygon
  profile: FarmProfile
}): InvestigationRequest {
  const { farmId, polygon, profile } = args
  const { lat, lon } = polygonCentroid(polygon)
  const year = Number(profile.rotationYear)
  const nitrogen = num(profile.nitrogenPpm)
  const sampled = profile.sampledAt.trim()
  const lab = profile.labName.trim()

  const request = {
    farm_id: farmId,
    lat: round(lat),
    lon: round(lon),
    region: profile.region,
    current_rotation: profile.rotation.map((r) => ({
      crop_id: cropId(r.crop),
      season: r.season,
      year,
    })),
    soil_inputs: {
      ph: num(profile.soilPh),
      organic_carbon_pct: num(profile.organicCarbon),
      texture: textureId[profile.soilTexture],
      ...(nitrogen !== null ? { nitrogen_ppm: nitrogen } : {}),
      ...(sampled ? { sampled_at: sampled } : {}),
      ...(lab ? { lab_name: lab } : {}),
    },
    objectives: profile.objectives.trim() || waterText[profile.water],
    priorities: prioritiesFromProfile(profile),
    constraints: {
      forbidden_crops: profile.forbiddenCrops.map(cropId),
      required_crops: profile.requiredCrops.map(cropId),
      max_water_requirement: profile.maxWater === "any" ? null : profile.maxWater,
    },
  }

  const parsed = investigationRequestSchema.safeParse(request)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(`Invalid request: ${issue.path.join(".")} ${issue.message}`)
  }
  return parsed.data
}