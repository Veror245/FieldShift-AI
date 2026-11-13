import { useEffect, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import area from "@turf/area"
import { Layers, LocateFixed, MapPin, Pencil, Satellite, Search, Trash2 } from "lucide-react"
import ThinkingOrb from "@/components/common/ThinkingOrb"
import { Button } from "@/components/ui/button"
import { dateFor, nasaLayers, tileUrl } from "@/lib/nasaLayers"
import { computePolygonCentroid, reverseGeocode, type GeocodedAddress } from "@/utils/reverseGeocode"
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
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
      paint: {
        "raster-saturation": 0.15,
        "raster-contrast": 0.05,
      },
    },
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
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const polygonRef = useRef(polygon)

  const [ready, setReady] = useState(false)
  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite")
  const [drawing, setDrawing] = useState(false)
  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")
  const [fieldAddress, setFieldAddress] = useState<GeocodedAddress | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [opacity, setOpacity] = useState(70)

  useEffect(() => {
    onChangeRef.current = onChange
    polygonRef.current = polygon
  })

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
      locationMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

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

  useEffect(() => {
    if (!polygon || !polygon.geometry || !polygon.geometry.coordinates[0]?.length) {
      setFieldAddress(null)
      return
    }
    const coords = polygon.geometry.coordinates[0] as [number, number][]
    const [lng, lat] = computePolygonCentroid(coords)
    reverseGeocode(lng, lat).then((res) => {
      setFieldAddress(res)
    }).catch(() => {
      setFieldAddress(null)
    })
  }, [polygon])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setLayoutProperty("satellite", "visibility", basemap === "satellite" ? "visible" : "none")
    map.setLayoutProperty("streets", "visibility", basemap === "streets" ? "visible" : "none")
  }, [basemap, ready])

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
    setFieldAddress(null)
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

  const locateMe = () => {
    const map = mapRef.current
    if (!map) return
    if (!("geolocation" in navigator)) {
      setMessage("Your browser does not support location finding.")
      return
    }
    setLocating(true)
    setMessage("")
    const startTime = Date.now()

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const elapsed = Date.now() - startTime
        const minDelay = 1200
        const remaining = Math.max(0, minDelay - elapsed)

        setTimeout(() => {
          setLocating(false)
          const center: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          if (locationMarkerRef.current) locationMarkerRef.current.remove()
          const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setText("Current GPS Location")
          locationMarkerRef.current = new maplibregl.Marker({ color: "#2563EB" })
            .setLngLat(center)
            .setPopup(popup)
            .addTo(map)
          map.flyTo({ center, zoom: 16, duration: 1500 })
        }, remaining)
      },
      (err) => {
        const elapsed = Date.now() - startTime
        const minDelay = 1000
        const remaining = Math.max(0, minDelay - elapsed)

        setTimeout(() => {
          setLocating(false)
          if (err.code === err.PERMISSION_DENIED) {
            setMessage("Location permission denied. Allow it in your browser settings, or search for your village instead.")
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setMessage("Could not get your location. Check that location services are on.")
          } else {
            setMessage("Getting your location took too long. Try again.")
          }
        }, remaining)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const activeCount = Object.values(active).filter(Boolean).length

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-forest/10">
      <div ref={containerRef} className="h-full w-full" />

      <div
        className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center transition-all duration-700 ease-in-out ${
          locating
            ? "pointer-events-auto bg-stone-900/40 backdrop-blur-md opacity-100"
            : "pointer-events-none bg-stone-900/0 backdrop-blur-none opacity-0"
        }`}
      >
        <div
          className={`flex items-center gap-4 rounded-2xl border border-white/20 bg-stone-950/85 px-6 py-4 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out ${
            locating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <ThinkingOrb
            state="searching"
            size={44}
            speed={1}
            theme="dark"
            aria-label="Agent searching location"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium tracking-tight text-white">
              Agent searching…
            </span>
            <span className="text-xs text-stone-400">
              Acquiring GPS coordinates
            </span>
          </div>
        </div>
      </div>

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
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={locateMe}
          disabled={locating}
          className="h-11 w-11 rounded-xl bg-white/90 shadow backdrop-blur hover:bg-white"
          aria-label="Find my GPS location"
          title="Find my GPS location"
        >
          <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse text-blue-500" : ""}`} />
        </Button>
      </form>

      {message && (
        <p className="absolute left-3 top-16 z-30 rounded-lg bg-white/90 px-3 py-1 text-xs shadow">
          {message}
        </p>
      )}

      {polygon && fieldAddress && !panelOpen && (
        <div
          className={`absolute left-3 ${message ? "top-24" : "top-16"} z-20 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl bg-forest/90 px-3.5 py-2 text-xs text-ivory shadow-lg backdrop-blur`}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 text-sage" />
          <div className="truncate">
            <span className="font-medium text-sage/90">Location: </span>
            <span className="font-semibold">{fieldAddress.formatted}</span>
          </div>
        </div>
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
        <Button
          variant="secondary"
          onClick={locateMe}
          disabled={locating}
          className="h-11 rounded-xl"
          title="Use your device GPS to center the map on your location"
        >
          <LocateFixed className={`mr-2 h-4 w-4 ${locating ? "animate-pulse text-blue-500" : ""}`} />
          {locating ? "Locating…" : "My location"}
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
