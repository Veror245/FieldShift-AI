import { useEffect, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import area from "@turf/area"
import { Layers, Pencil, Satellite, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dateFor, nasaLayers, tileUrl } from "@/lib/nasaLayers"
import type { FieldPolygon } from "@/types/geojson"

const nasaSources = Object.fromEntries(
  nasaLayers.map((l) => [
    `nasa-${l.id}`,
    {
      type: "raster" as const,
      tiles: [tileUrl(l)],
      tileSize: 256,
      maxzoom: l.maxZoom,
      attribution: "Imagery: NASA GIBS",
    },
  ])
)

const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
    streets: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
    ...nasaSources,
  },
  layers: [
    { id: "streets", type: "raster", source: "streets", layout: { visibility: "none" } },
    { id: "satellite", type: "raster", source: "satellite" },
    ...nasaLayers.map((l) => ({
      id: `nasa-${l.id}`,
      type: "raster" as const,
      source: `nasa-${l.id}`,
      layout: { visibility: "none" as const },
      paint: { "raster-opacity": 0.7 },
    })),
  ],
}

const coordsKey = (p: FieldPolygon | null) => (p ? JSON.stringify(p.geometry.coordinates) : "")

// Shows the given polygon in the drawing tool. Returns true if it had to change anything.
function showPolygon(draw: TerraDraw, polygon: FieldPolygon | null): boolean {
  const existing = draw.getSnapshot().filter((f) => f.geometry.type === "Polygon")
  const current = existing.length
    ? JSON.stringify(existing[existing.length - 1].geometry.coordinates)
    : ""
  if (current === coordsKey(polygon)) return false

  draw.clear()
  if (polygon) {
    try {
      draw.addFeatures([
        { type: "Feature", properties: { mode: "polygon" }, geometry: polygon.geometry },
      ] as Parameters<TerraDraw["addFeatures"]>[0])
    } catch {
      /* ignore an outline the drawing tool cannot show */
    }
  }
  return true
}

function fitTo(map: maplibregl.Map, polygon: FieldPolygon, duration: number) {
  const ring = polygon.geometry.coordinates[0] as [number, number][]
  const bounds = new maplibregl.LngLatBounds(ring[0], ring[0])
  ring.forEach((p) => bounds.extend(p))
  map.fitBounds(bounds, { padding: 70, maxZoom: 17, duration })
}

type Props = {
  polygon: FieldPolygon | null
  onChange: (polygon: FieldPolygon | null, hectares: number) => void
}

export default function FieldMap({ polygon, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const onChangeRef = useRef(onChange)
  const polygonRef = useRef(polygon)

  const [ready, setReady] = useState(false)
  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite")
  const [drawing, setDrawing] = useState(false)
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")
  const [panelOpen, setPanelOpen] = useState(false)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [opacity, setOpacity] = useState(70)

  useEffect(() => {
    onChangeRef.current = onChange
    polygonRef.current = polygon
  })

  // Create the map and the drawing tool once
  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [78.96, 20.59],
      zoom: 4,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right")
    mapRef.current = map

    map.on("load", () => {
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode({
            styles: {
              fillColor: "#1E3A2F",
              fillOpacity: 0.25,
              outlineColor: "#E08E45",
              outlineWidth: 3,
            },
          }),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: { midpoints: true, draggable: true, deletable: true },
                },
              },
            },
            styles: {
              selectedPolygonColor: "#1E3A2F",
              selectedPolygonFillOpacity: 0.25,
              selectedPolygonOutlineColor: "#E08E45",
              selectedPolygonOutlineWidth: 3,
            },
          }),
        ],
      })
      draw.start()
      drawRef.current = draw

      draw.on("finish", (_id, context) => {
        const polygons = draw.getSnapshot().filter((f) => f.geometry.type === "Polygon")
        if (polygons.length === 0) return

        // Keep only one field: remove older polygons
        if (polygons.length > 1) {
          draw.removeFeatures(polygons.slice(0, -1).map((f) => f.id as string))
        }

        const last = polygons[polygons.length - 1] as unknown as FieldPolygon
        const hectares = area(last as unknown as Parameters<typeof area>[0]) / 10000
        onChangeRef.current(last, hectares)

        if (context.mode === "polygon") {
          setDrawing(false)
          draw.setMode("select")
        }
      })

      // Show a saved field again when coming back to this page
      const saved = polygonRef.current
      if (saved) {
        showPolygon(draw, saved)
        fitTo(map, saved, 0)
        draw.setMode("select")
      }

      setReady(true)
    })

    return () => {
      setReady(false)
      drawRef.current?.stop()
      drawRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw a field that was loaded from outside (sample farm, upload, saved)
  useEffect(() => {
    const map = mapRef.current
    const draw = drawRef.current
    if (!ready || !map || !draw) return
    const changed = showPolygon(draw, polygon)
    if (changed && polygon) {
      fitTo(map, polygon, 900)
      draw.setMode("select")
    }
  }, [polygon, ready])

  // Satellite or street basemap
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setLayoutProperty("satellite", "visibility", basemap === "satellite" ? "visible" : "none")
    map.setLayoutProperty("streets", "visibility", basemap === "streets" ? "visible" : "none")
  }, [basemap, ready])

  // NASA layers on or off, and opacity
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    nasaLayers.forEach((l) => {
      const id = `nasa-${l.id}`
      if (!map.getLayer(id)) return
      map.setLayoutProperty(id, "visibility", active[l.id] ? "visible" : "none")
      map.setPaintProperty(id, "raster-opacity", opacity / 100)
    })
  }, [active, opacity, ready])

  const startDrawing = () => {
    if (!drawRef.current) return
    drawRef.current.setMode("polygon")
    setDrawing(true)
  }

  const clearField = () => {
    drawRef.current?.clear()
    drawRef.current?.setMode("select")
    setDrawing(false)
    onChange(null, 0)
  }

  const search = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!query.trim()) return
    setMessage("Searching…")
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      )
      const data: { lat: string; lon: string }[] = await res.json()
      if (!data.length) {
        setMessage("Place not found. Try a nearby town or village.")
        return
      }
      mapRef.current?.flyTo({
        center: [Number(data[0].lon), Number(data[0].lat)],
        zoom: 15,
      })
      setMessage("")
    } catch {
      setMessage("Search failed. Check your internet connection.")
    }
  }

  const activeCount = Object.values(active).filter(Boolean).length

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-forest/10">
      <div ref={containerRef} className="h-full w-full" />

      <form
        onSubmit={search}
        className="absolute left-3 right-3 top-3 z-10 flex max-w-md gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a village, town or address"
          className="h-11 flex-1 rounded-xl border border-forest/10 bg-white/90 px-4 text-sm shadow backdrop-blur outline-none focus:ring-2 focus:ring-sage"
        />
        <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>
      </form>

      {message && (
        <p className="absolute left-3 top-16 z-30 rounded-lg bg-white/90 px-3 py-1 text-xs shadow">
          {message}
        </p>
      )}

      {panelOpen && (
         <div className="absolute left-3 top-16 z-20 max-h-[calc(100%-11.5rem)] w-72 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
          <p className="text-sm font-semibold">NASA satellite layers</p>
          <p className="mb-3 text-xs text-forest/60">
            Coarse regional context from NASA GIBS. These are not measurements of your exact field.
          </p>

          <div className="space-y-1">
            {nasaLayers.map((l) => (
              <label
                key={l.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-forest/5"
              >
                <input
                  type="checkbox"
                  checked={!!active[l.id]}
                  onChange={(e) => setActive((a) => ({ ...a, [l.id]: e.target.checked }))}
                  className="mt-0.5 h-5 w-5 accent-forest"
                />
                <span className="text-sm">
                  <span className="font-medium">{l.label}</span>
                  <br />
                  <span className="text-xs text-forest/60">
                    {l.description} Latest around {dateFor(l.lagDays)}.
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Layer opacity</span>
              <span>{opacity}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={10}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              aria-label="Layer opacity"
              className="w-full accent-forest"
            />
          </div>
        </div>
      )}

      {drawing && (
        <p className="absolute bottom-20 left-3 z-10 hidden max-w-sm rounded-xl bg-forest px-4 py-2 text-xs text-ivory shadow md:block">
          Click each corner of your field. Click the last point again to finish.
        </p>
      )}

      <div className="absolute bottom-3 left-3 right-14 z-10 flex flex-wrap gap-2">
        <Button onClick={startDrawing} className="h-11 rounded-xl">
          <Pencil className="mr-2 h-4 w-4" />
          {drawing ? "Drawing…" : "Draw field"}
        </Button>
        <Button variant="secondary" onClick={clearField} className="h-11 rounded-xl">
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button
          variant="secondary"
          onClick={() => setBasemap(basemap === "satellite" ? "streets" : "satellite")}
          className="h-11 rounded-xl"
        >
          <Layers className="mr-2 h-4 w-4" />
          {basemap === "satellite" ? "Street map" : "Satellite"}
        </Button>
        <Button
          variant={panelOpen ? "default" : "secondary"}
          onClick={() => setPanelOpen((v) => !v)}
          className="h-11 rounded-xl"
          aria-expanded={panelOpen}
        >
          <Satellite className="mr-2 h-4 w-4" />
          NASA layers{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>
    </div>
  )
}