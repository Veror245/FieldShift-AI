export type FieldPolygon = {
  type: "Feature"
  properties: Record<string, unknown>
  geometry: { type: "Polygon"; coordinates: number[][][] }
}