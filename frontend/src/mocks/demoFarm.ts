import area from "@turf/area"
import type { FarmProfile } from "@/types/farm"
import type { FieldPolygon } from "@/types/geojson"

// SAMPLE DATA for demos. The outline is not a real farm.
const polygon: FieldPolygon = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [88.45, 22.7],
        [88.4524, 22.7004],
        [88.4526, 22.7028],
        [88.4503, 22.7024],
        [88.45, 22.7],
      ],
    ],
  },
}

const profile: FarmProfile = {
  farmName: "Sample farm",
  rotation: ["Rice", "Wheat"],
  soilPh: "6.4",
  soilTexture: "loamy",
  organicMatter: "",
  water: "unreliable",
  waterPriority: 70,
  costPriority: 40,
  soilPriority: 70,
}

export const demoFarm = {
  polygon,
  hectares: area(polygon as unknown as Parameters<typeof area>[0]) / 10000,
  profile,
}