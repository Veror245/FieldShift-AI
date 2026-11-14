import area from "@turf/area"
import type { FarmProfile } from "@/types/farm"
import { defaultPriorities } from "@/types/farm"
import type { FieldPolygon } from "@/types/geojson"

const polygon: FieldPolygon = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [75.17, 30.82],
        [75.1726, 30.8203],
        [75.1728, 30.8229],
        [75.1703, 30.8226],
        [75.17, 30.82],
      ],
    ],
  },
}

const profile: FarmProfile = {
  farmName: "Sample farm",
  region: "punjab_in",
  rotation: [
    { crop: "Rice", season: "kharif" },
    { crop: "Wheat", season: "rabi" },
  ],
  rotationYear: String(new Date().getFullYear() - 1),
  soilPh: "7.8",
  organicCarbon: "0.45",
  soilTexture: "loamy",
  nitrogenPpm: "180",
  sampledAt: "2024-03-15",
  labName: "Punjab Soil Lab",
  water: "unreliable",
  waterPriority: 70,
  costPriority: 40,
  soilPriority: 70,
  priorities: defaultPriorities,
  objectives:
    "Water availability has become unreliable. I want to improve soil health without taking excessive economic risks.",
  forbiddenCrops: [],
  requiredCrops: [],
  maxWater: "medium",
}

export const demoFarm = {
  polygon,
  hectares: area(polygon as unknown as Parameters<typeof area>[0]) / 10000,
  profile,
}
