import { useEffect, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import area from "@turf/area"
import { Layers, Pencil, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FieldPolygon } from "@/types/geojson"

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
  },
  layers: [
    { id: "streets", type: "raster", source: "streets", layout: { visibility: "none" } },
    { id: "satellite", type: "raster", source: "satellite" },
  ],
}

type Props = {
  onChange: (polygon: FieldPolygon | null, hectares: number) => void
}

export default function FieldMap({ onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const onChangeRef = useRef(onChange)

  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite")
  const [drawing, setDrawing] = useState(false)
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

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
    })

    return () => {
      drawRef.current?.stop()
      drawRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Switch between satellite and street view
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      map.setLayoutProperty("satellite", "visibility", basemap === "satellite" ? "visible" : "none")
      map.setLayoutProperty("streets", "visibility", basemap === "streets" ? "visible" : "none")
    }
    if (map.isStyleLoaded()) apply()
    else map.once("load", apply)
  }, [basemap])

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
        <p className="absolute left-3 top-16 z-10 rounded-lg bg-white/90 px-3 py-1 text-xs shadow">
          {message}
        </p>
      )}

      {drawing && (
        <p className="absolute bottom-20 left-3 z-10 hidden max-w-sm rounded-xl bg-forest px-4 py-2 text-xs text-ivory shadow md:block">
          Click each corner of your field. Click the last point again to finish.
        </p>
      )}

      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
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
      </div>
    </div>
  )
}