import { z } from "zod"
import type { FarmProfile } from "@/types/farm"
import type { FieldPolygon } from "@/types/geojson"

// This matches the JSON structure the backend team asked for.
export const investigationRequestSchema = z.object({
  farm_id: z.string().uuid(),
  field: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
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
  constraints: z.object({
    forbidden_crops: z.array(z.string()),
    required_crops: z.array(z.string()),
    max_water_requirement: z.enum(["low", "medium", "high"]).nullable(),
  }),
})

export type InvestigationRequest = z.infer<typeof investigationRequestSchema>

// Check these words with the backend team and edit them here if they differ.
const textureId: Record<FarmProfile["soilTexture"], string> = {
  unknown: "unknown",
  sandy: "sand",
  loamy: "loam",
  clay: "clay",
  silty: "silt",
}

const waterText: Record<FarmProfile["water"], string> = {
  reliable: "Irrigation is reliable all season",
  unreliable: "Water availability has become unreliable",
  rainfed: "The farm is rain-fed only",
}

const cropId = (c: string) => c.trim().toLowerCase().replace(/\s+/g, "_")
const num = (v: string) => (v.trim() === "" ? null : Number(v))
const round = (n: number) => Number(n.toFixed(5))

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

function composeObjectives(p: FarmProfile): string {
  const own = p.objectives.trim()
  const lead = own ? (/[.!?]$/.test(own) ? own : `${own}.`) : `${waterText[p.water]}.`
  return `${lead} Priorities (0 to 100): save water ${p.waterPriority}, keep costs low ${p.costPriority}, improve soil health ${p.soilPriority}.`
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
    field: { lat: round(lat), lon: round(lon) },
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
    objectives: composeObjectives(profile),
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