import area from "@turf/area"
import type { FieldPolygon } from "@/types/geojson"

export type ParsedField = { polygon: FieldPolygon; hectares: number }

type Geo = {
  type?: string
  features?: Geo[]
  geometry?: Geo | null
  coordinates?: unknown
}

function firstRing(data: Geo | null | undefined): number[][] | null {
  if (!data) return null
  if (data.type === "FeatureCollection") {
    for (const f of data.features ?? []) {
      const ring = firstRing(f)
      if (ring) return ring
    }
    return null
  }
  if (data.type === "Feature") return firstRing(data.geometry)
  if (data.type === "Polygon") return (data.coordinates as number[][][])?.[0] ?? null
  if (data.type === "MultiPolygon") return (data.coordinates as number[][][][])?.[0]?.[0] ?? null
  return null
}

export function parseFieldGeoJSON(text: string): ParsedField {
  let data: Geo
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("This file is not valid JSON. Please upload a GeoJSON file.")
  }

  const ring = firstRing(data)
  if (!ring || ring.length < 3) {
    throw new Error("No field outline found. The file needs a Polygon with at least 3 corners.")
  }

  const coords = ring.map((p) => [Number(p[0]), Number(p[1])])
  const invalid = coords.some(
    ([lon, lat]) =>
      !Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90
  )
  if (invalid) {
    throw new Error("The coordinates are not valid longitude and latitude values (WGS84 / EPSG:4326).")
  }

  const [fx, fy] = coords[0]
  const [lx, ly] = coords[coords.length - 1]
  if (fx !== lx || fy !== ly) coords.push([fx, fy])
  if (coords.length < 4) throw new Error("The outline needs at least 3 different corners.")

  const polygon: FieldPolygon = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  }
  const hectares = area(polygon as unknown as Parameters<typeof area>[0]) / 10000

  if (hectares < 0.01) throw new Error("This outline is too small to be a field.")
  if (hectares > 10000) throw new Error("This outline is over 10,000 ha, which is too large for a single field.")

  return { polygon, hectares }
}