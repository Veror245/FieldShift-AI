import { useEffect, useRef, useState, useCallback } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import area from "@turf/area"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  Layers,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Satellite,
  Search,
  Trash2,
} from "lucide-react"
import ThinkingOrb from "@/components/common/ThinkingOrb"
import { Button } from "@/components/ui/button"
import { dateFor, nasaLayers, tileUrl } from "@/lib/nasaLayers"
import {
  computePolygonCentroid,
  formatCoordinates,
  reverseGeocode,
  type GeocodedAddress,
} from "@/utils/reverseGeocode"
import { uiSoundEngine } from "@/utils/uiSoundEngine"
import type { FieldPolygon } from "@/types/geojson"

function distanceMeters(c1?: [number, number], c2?: [number, number]): number {
  if (!c1 || !c2) return 0
  const R = 6371000
  const dLat = ((c2[1] - c1[1]) * Math.PI) / 180
  const dLng = ((c2[0] - c1[0]) * Math.PI) / 180
  const lat1 = (c1[1] * Math.PI) / 180
  const lat2 = (c2[1] * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function formatDist(m: number): string {
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toFixed(1)} km`
}

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
  onLocationFound?: (info: { lat: number; lng: number; address?: GeocodedAddress }) => void
}

export default function FieldMap({ polygon, onChange, onLocationFound }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const polygonRef = useRef(polygon)
  const onLocationFoundRef = useRef(onLocationFound)

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
  const [cursorCoords, setCursorCoords] = useState<[number, number] | null>(null)

  const [livePoints, setLivePoints] = useState<[number, number][]>([])
  const [redoStack, setRedoStack] = useState<[number, number][]>([])
  const [screenCoords, setScreenCoords] = useState<{ x: number; y: number }[]>([])
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null)
  const [screenCursor, setScreenCursor] = useState<{ x: number; y: number } | null>(null)
  const [savedCoords, setSavedCoords] = useState<[number, number][]>([])
  const [savedScreenCoords, setSavedScreenCoords] = useState<{ x: number; y: number }[]>([])
  const [liveHectares, setLiveHectares] = useState(0)
  const [prospectiveHa, setProspectiveHa] = useState(0)
  const [savedHa, setSavedHa] = useState(0)

  useEffect(() => {
    onChangeRef.current = onChange
    polygonRef.current = polygon
    onLocationFoundRef.current = onLocationFound
  })

  const projectCoords = useCallback((coords: [number, number][]) => {
    const map = mapRef.current
    if (!map) return []
    return coords.map((c) => {
      const pt = map.project(c)
      return { x: pt.x, y: pt.y }
    })
  }, [])

  const updateScreenCoords = useCallback(() => {
    if (livePoints.length > 0) {
      setScreenCoords(projectCoords(livePoints))
    } else {
      setScreenCoords([])
    }
    if (savedCoords.length > 0) {
      setSavedScreenCoords(projectCoords(savedCoords))
    } else {
      setSavedScreenCoords([])
    }
  }, [livePoints, savedCoords, projectCoords])

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
              outlineColor: "#2563EB",
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
              selectedPolygonOutlineColor: "#2563EB",
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

        const ring = (last.geometry.coordinates[0] || []) as [number, number][]
        const uniqueCoords = ring.slice(0, -1)
        setSavedCoords(uniqueCoords)
        setSavedHa(hectares)
        setSavedScreenCoords(projectCoords(uniqueCoords))

        const centroid = computePolygonCentroid(uniqueCoords)
        reverseGeocode(centroid[0], centroid[1]).then((addr) => {
          setFieldAddress(addr)
          onLocationFoundRef.current?.({ lat: centroid[1], lng: centroid[0], address: addr })
        })

        if (context.mode === "polygon") {
          setDrawing(false)
          draw.setMode("select")
        }
      })

      draw.on("change", () => {
        const polygons = draw.getSnapshot().filter((f) => f.geometry.type === "Polygon")
        if (polygons.length > 0) {
          const last = polygons[polygons.length - 1] as unknown as FieldPolygon
          const hectares = area(last as unknown as Parameters<typeof area>[0]) / 10000
          onChangeRef.current(last, hectares)
          const ring = (last.geometry.coordinates[0] || []) as [number, number][]
          const uniqueCoords = ring.slice(0, -1)
          setSavedCoords(uniqueCoords)
          setSavedHa(hectares)
          setSavedScreenCoords(projectCoords(uniqueCoords))
        }
      })

      const saved = polygonRef.current
      if (saved) {
        showPolygon(draw, saved)
        fitTo(map, saved, 0)
        draw.setMode("select")
        const ring = (saved.geometry.coordinates[0] || []) as [number, number][]
        const uniqueCoords = ring.slice(0, -1)
        const hectares = area(saved as unknown as Parameters<typeof area>[0]) / 10000
        setSavedCoords(uniqueCoords)
        setSavedHa(hectares)
        setSavedScreenCoords(projectCoords(uniqueCoords))
        const centroid = computePolygonCentroid(uniqueCoords)
        reverseGeocode(centroid[0], centroid[1]).then((addr) => {
          setFieldAddress(addr)
          onLocationFoundRef.current?.({ lat: centroid[1], lng: centroid[0], address: addr })
        })
      }

      setReady(true)
    })

    map.on("mousemove", (e) => {
      setCursorCoords([e.lngLat.lng, e.lngLat.lat])
    })

    map.on("mouseout", () => {
      setCursorCoords(null)
    })

    return () => {
      setReady(false)
      drawRef.current?.stop()
      drawRef.current = null
      if (locationMarkerRef.current) {
        locationMarkerRef.current.remove()
        locationMarkerRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [projectCoords])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.on("move", updateScreenCoords)
    map.on("zoom", updateScreenCoords)
    return () => {
      map.off("move", updateScreenCoords)
      map.off("zoom", updateScreenCoords)
    }
  }, [updateScreenCoords])

  useEffect(() => {
    const map = mapRef.current
    const draw = drawRef.current
    if (!ready || !map || !draw) return
    const changed = showPolygon(draw, polygon)
    if (changed && polygon) {
      fitTo(map, polygon, 900)
      draw.setMode("select")
      const ring = (polygon.geometry.coordinates[0] || []) as [number, number][]
      const uniqueCoords = ring.slice(0, -1)
      const hectares = area(polygon as unknown as Parameters<typeof area>[0]) / 10000
      setSavedCoords(uniqueCoords)
      setSavedHa(hectares)
      setSavedScreenCoords(projectCoords(uniqueCoords))
      const centroid = computePolygonCentroid(uniqueCoords)
      reverseGeocode(centroid[0], centroid[1]).then((addr) => {
        setFieldAddress(addr)
        onLocationFoundRef.current?.({ lat: centroid[1], lng: centroid[0], address: addr })
      })
    } else if (!polygon) {
      setSavedCoords([])
      setSavedScreenCoords([])
      setSavedHa(0)
      setFieldAddress(null)
    }
  }, [polygon, ready, projectCoords])

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

  const calculateLiveHectares = useCallback((coords: [number, number][]) => {
    if (coords.length < 3) return 0
    try {
      const closed = [...coords, coords[0]]
      const poly = {
        type: "Polygon" as const,
        coordinates: [closed],
      }
      return area(poly) / 10000
    } catch {
      return 0
    }
  }, [])

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (!drawing) return
      const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      uiSoundEngine.playTick()

      setLivePoints((prev) => {
        const next = [...prev, coord]
        setScreenCoords(projectCoords(next))
        setLiveHectares(calculateLiveHectares(next))
        return next
      })
      setRedoStack([])
    },
    [drawing, projectCoords, calculateLiveHectares]
  )

  const handleMouseMove = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (!drawing) return
      const c: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      setCursorPos(c)
      setScreenCursor({ x: e.point.x, y: e.point.y })

      if (livePoints.length >= 2) {
        const prospective = [...livePoints, c]
        setProspectiveHa(calculateLiveHectares(prospective))
      } else {
        setProspectiveHa(0)
      }
    },
    [drawing, livePoints, calculateLiveHectares]
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (drawing) {
      map.on("click", handleMapClick)
      map.on("mousemove", handleMouseMove)
    } else {
      map.off("click", handleMapClick)
      map.off("mousemove", handleMouseMove)
    }

    return () => {
      map.off("click", handleMapClick)
      map.off("mousemove", handleMouseMove)
    }
  }, [drawing, handleMapClick, handleMouseMove])

  const startDrawing = () => {
    uiSoundEngine.playChipClickSfx()
    if (drawRef.current) {
      drawRef.current.clear()
      drawRef.current.setMode("select")
    }
    setLivePoints([])
    setRedoStack([])
    setScreenCoords([])
    setSavedCoords([])
    setSavedScreenCoords([])
    setLiveHectares(0)
    setProspectiveHa(0)
    setCursorPos(null)
    setScreenCursor(null)
    setDrawing(true)
    setMessage("")
  }

  const resumeDrawing = () => {
    if (savedCoords.length < 3) return
    uiSoundEngine.playChipClickSfx()
    if (drawRef.current) {
      drawRef.current.clear()
      drawRef.current.setMode("select")
    }
    setLivePoints([...savedCoords])
    setScreenCoords(projectCoords(savedCoords))
    setLiveHectares(savedHa)
    setRedoStack([])
    setDrawing(true)
    setMessage("")
  }

  const undoLastPoint = useCallback(() => {
    if (livePoints.length === 0) return
    uiSoundEngine.playTick()
    const last = livePoints[livePoints.length - 1]
    const next = livePoints.slice(0, -1)
    setLivePoints(next)
    setScreenCoords(projectCoords(next))
    setLiveHectares(calculateLiveHectares(next))
    setRedoStack((prev) => [...prev, last])
  }, [livePoints, projectCoords, calculateLiveHectares])

  const redoLastPoint = useCallback(() => {
    if (redoStack.length === 0) return
    uiSoundEngine.playTick()
    const nextCoord = redoStack[redoStack.length - 1]
    const next = [...livePoints, nextCoord]
    setLivePoints(next)
    setScreenCoords(projectCoords(next))
    setLiveHectares(calculateLiveHectares(next))
    setRedoStack((prev) => prev.slice(0, -1))
  }, [livePoints, redoStack, projectCoords, calculateLiveHectares])

  const completeDrawing = useCallback(() => {
    if (livePoints.length < 3) return
    uiSoundEngine.playCelebration()

    const ring = [...livePoints, livePoints[0]]
    const polyFeature: FieldPolygon = {
      type: "Feature",
      properties: { mode: "polygon" },
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
    }

    const calculatedHectares = area(polyFeature as unknown as Parameters<typeof area>[0]) / 10000

    if (drawRef.current) {
      drawRef.current.clear()
      try {
        drawRef.current.addFeatures([
          polyFeature as Parameters<TerraDraw["addFeatures"]>[0][0],
        ])
        drawRef.current.setMode("select")
      } catch {
      }
    }

    setSavedCoords(livePoints)
    setSavedScreenCoords(projectCoords(livePoints))
    setSavedHa(calculatedHectares)
    setDrawing(false)
    setLivePoints([])
    setRedoStack([])
    setCursorPos(null)
    setScreenCursor(null)

    onChangeRef.current(polyFeature, calculatedHectares)

    const centroid = computePolygonCentroid(livePoints)
    reverseGeocode(centroid[0], centroid[1]).then((addr) => {
      setFieldAddress(addr)
      onLocationFoundRef.current?.({ lat: centroid[1], lng: centroid[0], address: addr })
    })
  }, [livePoints, projectCoords])

  const cancelDrawing = useCallback(() => {
    uiSoundEngine.playChipClickSfx()
    setDrawing(false)
    setLivePoints([])
    setRedoStack([])
    setScreenCoords([])
    setCursorPos(null)
    setScreenCursor(null)
    if (savedCoords.length >= 3 && polygonRef.current && drawRef.current) {
      showPolygon(drawRef.current, polygonRef.current)
      drawRef.current.setMode("select")
    }
  }, [savedCoords])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawing) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        undoLastPoint()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redoLastPoint()
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (livePoints.length >= 3) completeDrawing()
      } else if (e.key === "Escape") {
        e.preventDefault()
        cancelDrawing()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [drawing, livePoints, undoLastPoint, redoLastPoint, completeDrawing, cancelDrawing])

  const clearField = () => {
    uiSoundEngine.playChipClickSfx()
    drawRef.current?.clear()
    drawRef.current?.setMode("select")
    setLivePoints([])
    setRedoStack([])
    setScreenCoords([])
    setSavedCoords([])
    setSavedScreenCoords([])
    setDrawing(false)
    setLiveHectares(0)
    setProspectiveHa(0)
    setSavedHa(0)
    setMessage("")
    setFieldAddress(null)
    onChange(null, 0)
  }

  const handleLocateMe = () => {
    if (locating) return
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.")
      return
    }

    setLocating(true)
    setMessage("")
    uiSoundEngine.playChipClickSfx()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords
        const map = mapRef.current
        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 2200,
          })

          if (locationMarkerRef.current) {
            locationMarkerRef.current.remove()
          }
          locationMarkerRef.current = new maplibregl.Marker({ color: "#2563EB" })
            .setLngLat([longitude, latitude])
            .addTo(map)

          reverseGeocode(longitude, latitude).then((addr) => {
            setFieldAddress(addr)
            onLocationFoundRef.current?.({ lat: latitude, lng: longitude, address: addr })
          })
        }
        setTimeout(() => {
          setLocating(false)
        }, 700)
      },
      (error) => {
        setTimeout(() => {
          setLocating(false)
        }, 700)
        if (error.code === error.PERMISSION_DENIED) {
          setMessage("Location permission denied. Please allow location access in your browser.")
        } else {
          setMessage("Unable to retrieve your location.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
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

  const activeSegmentDistance =
    drawing && cursorPos && livePoints.length > 0
      ? distanceMeters(livePoints[livePoints.length - 1], cursorPos)
      : null

  const activeSegmentMidpoint =
    drawing && screenCursor && screenCoords.length > 0
      ? {
          x: (screenCoords[screenCoords.length - 1].x + screenCursor.x) / 2,
          y: (screenCoords[screenCoords.length - 1].y + screenCursor.y) / 2,
        }
      : null

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-forest/10">
      <div
        ref={containerRef}
        className={`h-full w-full transition-all duration-300 ${drawing ? "cursor-crosshair" : ""}`}
      />

      <div
        className={`pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
          locating
            ? "bg-stone-900/40 backdrop-blur-md opacity-100 pointer-events-auto"
            : "bg-stone-900/0 backdrop-blur-none opacity-0"
        }`}
      >
        <div
          className={`flex items-center gap-3.5 rounded-2xl border border-white/15 bg-black/80 px-5 py-3.5 shadow-2xl transition-all duration-700 ${
            locating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <ThinkingOrb
            state="searching"
            size={32}
            speed={1.1}
            theme="dark"
            className="shrink-0"
            aria-label="Agent searching for location"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide text-white">Agent searching…</span>
            <span className="text-xs text-white/60">Acquiring GPS coordinates</span>
          </div>
        </div>
      </div>

      <svg className="absolute inset-0 pointer-events-none w-full h-full z-15 overflow-visible">
        <defs>
          <linearGradient id="glassFieldFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {drawing && screenCoords.length >= 3 && (
          <>
            <polygon
              points={screenCoords.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="url(#glassFieldFill)"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeDasharray="7 5"
              className="animate-field-dash"
            />
            <polygon
              points={screenCoords.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1"
            />
          </>
        )}

        {drawing && screenCoords.length >= 2 && (
          <polyline
            points={screenCoords.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
          />
        )}

        {drawing && screenCursor && screenCoords.length > 0 && (
          <>
            <line
              x1={screenCoords[screenCoords.length - 1].x}
              y1={screenCoords[screenCoords.length - 1].y}
              x2={screenCursor.x}
              y2={screenCursor.y}
              stroke="#2563EB"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <line
              x1={screenCursor.x}
              y1={screenCursor.y}
              x2={screenCoords[0].x}
              y2={screenCoords[0].y}
              stroke="#60A5FA"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {screenCoords.length >= 2 && (
              <polygon
                points={`${screenCoords.map((p) => `${p.x},${p.y}`).join(" ")} ${screenCursor.x},${screenCursor.y}`}
                fill="rgba(37, 99, 235, 0.12)"
                stroke="#2563EB"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
            {activeSegmentDistance !== null && activeSegmentMidpoint && (
              <g transform={`translate(${activeSegmentMidpoint.x}, ${activeSegmentMidpoint.y})`}>
                <rect x="-28" y="-11" width="56" height="22" rx="6" fill="#182016" stroke="rgba(230, 224, 210, 0.25)" strokeWidth="1" opacity="0.95" />
                <text x="0" y="4" fill="#F4F0E6" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {formatDist(activeSegmentDistance)}
                </text>
              </g>
            )}
          </>
        )}

        {drawing &&
          screenCoords.map((pt, i) => (
            <g key={`live-pt-${i}`} transform={`translate(${pt.x}, ${pt.y})`}>
              <circle r="7" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
              <rect x="9" y="-12" width="18" height="15" rx="4" fill="#182016" stroke="rgba(230, 224, 210, 0.3)" strokeWidth="1" />
              <text x="18" y="-2" fill="#F4F0E6" fontSize="10" fontWeight="bold" textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}

        {drawing &&
          screenCoords.length >= 2 &&
          screenCoords.map((pt, idx) => {
            if (idx === screenCoords.length - 1) return null
            const next = screenCoords[idx + 1]
            const midX = (pt.x + next.x) / 2
            const midY = (pt.y + next.y) / 2
            const dist = distanceMeters(livePoints[idx], livePoints[idx + 1])
            return (
              <g key={`live-dist-${idx}`} transform={`translate(${midX}, ${midY})`}>
                <rect x="-24" y="-9" width="48" height="18" rx="4" fill="#182016" stroke="rgba(230, 224, 210, 0.25)" strokeWidth="1" opacity="0.95" />
                <text x="0" y="3" fill="#F4F0E6" fontSize="9" fontWeight="600" textAnchor="middle">
                  {formatDist(dist)}
                </text>
              </g>
            )
          })}

        {!drawing && savedScreenCoords.length >= 3 && savedCoords.length >= 3 && (
          <>
            {savedScreenCoords.map((pt, i) => {
              if (i >= savedCoords.length) return null
              const nextPt = savedScreenCoords[(i + 1) % savedScreenCoords.length]
              const nextCoord = savedCoords[(i + 1) % savedCoords.length]
              if (!savedCoords[i] || !nextCoord || !nextPt) return null
              const midX = (pt.x + nextPt.x) / 2
              const midY = (pt.y + nextPt.y) / 2
              const dist = distanceMeters(savedCoords[i], nextCoord)
              return (
                <g key={`saved-corner-${i}`}>
                  <g transform={`translate(${pt.x}, ${pt.y})`}>
                    <circle r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                    <rect x="8" y="-11" width="16" height="14" rx="3" fill="#182016" stroke="rgba(230, 224, 210, 0.3)" strokeWidth="1" />
                    <text x="16" y="-1" fill="#F4F0E6" fontSize="9" fontWeight="bold" textAnchor="middle">
                      {i + 1}
                    </text>
                  </g>
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-24" y="-8" width="48" height="16" rx="4" fill="#182016" stroke="rgba(230, 224, 210, 0.25)" strokeWidth="1" opacity="0.95" />
                    <text x="0" y="3" fill="#F4F0E6" fontSize="9" fontWeight="600" textAnchor="middle">
                      {formatDist(dist)}
                    </text>
                  </g>
                </g>
              )
            })}
          </>
        )}
      </svg>

      <form
        onSubmit={search}
        className="absolute left-3 right-3 top-3 z-20 flex max-w-md gap-2"
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
          onClick={handleLocateMe}
          disabled={locating}
          className="h-11 w-11 rounded-xl border border-forest/10 bg-white/90 shadow backdrop-blur"
          aria-label="Locate my position with GPS"
        >
          <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse text-blue-600" : ""}`} />
        </Button>
      </form>

      {fieldAddress && (
        <div className="absolute left-3 top-16 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-forest/10 bg-white/90 px-3 py-1.5 text-xs font-medium text-forest shadow backdrop-blur">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-sage" />
            <span>Location: {fieldAddress.formatted}</span>
          </div>
          {fieldAddress.lat !== undefined && fieldAddress.lng !== undefined && (
            <span className="rounded bg-forest/10 px-1.5 py-0.5 font-mono text-[11px] text-forest/80">
              {formatCoordinates(fieldAddress.lat, fieldAddress.lng)}
            </span>
          )}
        </div>
      )}

      {message && (
        <p className="absolute left-3 top-24 z-20 rounded-lg bg-white/95 px-3 py-1 text-xs text-forest shadow">
          {message}
        </p>
      )}

      {cursorCoords && (
        <div className="pointer-events-none absolute bottom-3 right-16 z-10 hidden rounded-lg border border-forest/10 bg-white/85 px-2.5 py-1 font-mono text-[11px] text-forest/80 shadow backdrop-blur sm:block">
          {formatCoordinates(cursorCoords[1], cursorCoords[0])}
        </div>
      )}

      <AnimatePresence>
        {drawing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.16 }}
            className="absolute top-16 left-3 right-3 z-20 mx-auto max-w-lg rounded-2xl border border-white/15 bg-black/80 p-3.5 text-white shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span className="text-xs font-semibold">
                  {livePoints.length === 0
                    ? "Click corners on map to outline field"
                    : `${livePoints.length} corners marked (Click to add more)`}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                {liveHectares > 0 && (
                  <span className="font-bold text-blue-300">
                    {liveHectares.toFixed(2)} ha
                  </span>
                )}
                {livePoints.length >= 2 && prospectiveHa > 0 && (
                  <span className="text-[10px] text-white/60">
                    (Est: {prospectiveHa.toFixed(2)} ha)
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[10px] text-white/60">
              <div className="flex flex-wrap items-center gap-2">
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white">Ctrl+Z</kbd> Undo</span>
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white">Ctrl+Y</kbd> Redo</span>
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white">Enter</kbd> Finish</span>
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white">Esc</kbd> Cancel</span>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={undoLastPoint}
                  disabled={livePoints.length === 0}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={redoLastPoint}
                  disabled={redoStack.length === 0}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                >
                  Redo
                </button>
                <button
                  type="button"
                  onClick={completeDrawing}
                  disabled={livePoints.length < 3}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1 text-[11px] font-bold text-white shadow hover:bg-blue-500 disabled:opacity-40 transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  Done ({livePoints.length} {livePoints.length === 1 ? "corner" : "corners"})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <div className="absolute bottom-3 left-3 right-14 z-20 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={startDrawing}
          className={`h-11 rounded-xl shadow transition-all ${
            drawing
              ? "bg-blue-600 text-white font-bold hover:bg-blue-700"
              : "bg-forest text-ivory hover:bg-forest/90"
          }`}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {drawing ? "Marking field…" : savedCoords.length >= 3 ? "Redraw field" : "Draw field"}
        </Button>

        {drawing && (
          <Button
            type="button"
            onClick={completeDrawing}
            disabled={livePoints.length < 3}
            className="h-11 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow disabled:opacity-40"
          >
            <Check className="mr-2 h-4 w-4" />
            Done ({livePoints.length} {livePoints.length === 1 ? "corner" : "corners"})
          </Button>
        )}

        {!drawing && savedCoords.length >= 3 && (
          <Button
            type="button"
            variant="secondary"
            onClick={resumeDrawing}
            className="h-11 rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add corners
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={handleLocateMe}
          disabled={locating}
          className="h-11 rounded-xl"
        >
          <LocateFixed className={`mr-2 h-4 w-4 ${locating ? "animate-pulse text-blue-600" : ""}`} />
          {locating ? "Locating…" : "My location"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={clearField}
          className="h-11 rounded-xl"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            uiSoundEngine.playChipClickSfx()
            setBasemap(basemap === "satellite" ? "streets" : "satellite")
          }}
          className="h-11 rounded-xl"
        >
          <Layers className="mr-2 h-4 w-4" />
          {basemap === "satellite" ? "Street map" : "Satellite"}
        </Button>

        <Button
          type="button"
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
