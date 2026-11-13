import { useEffect, useRef, useState, useCallback } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import area from "@turf/area"
import { motion, AnimatePresence } from "framer-motion"
import { LocateFixed } from "lucide-react"
import {
  CheckIcon,
  LayersIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  TrashIcon,
  SatelliteIcon,
} from "@/components/common/Icons"
import ThinkingOrb from "@/components/common/ThinkingOrb"
import { Button } from "@/components/ui/button"
import { uiSoundEngine } from "@/utils/uiSoundEngine"
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

function distanceMeters(c1?: [number, number], c2?: [number, number]) {
  if (!c1 || !c2 || !Array.isArray(c1) || !Array.isArray(c2)) return 0
  const R = 6371e3
  const p1 = (c1[1] * Math.PI) / 180
  const p2 = (c2[1] * Math.PI) / 180
  const dp = ((c2[1] - c1[1]) * Math.PI) / 180
  const dl = ((c2[0] - c1[0]) * Math.PI) / 180
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatDist(meters: number): string {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(2)} km`
}

type Props = {
  polygon?: FieldPolygon | null
  initialPolygon?: FieldPolygon | null
  onChange: (polygon: FieldPolygon | null, hectares: number) => void
}

export default function FieldMap({ polygon, initialPolygon, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)

  const activePoly = polygon ?? initialPolygon ?? null

  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite")
  const [drawing, setDrawing] = useState(false)
  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")
  const [fieldAddress, setFieldAddress] = useState<GeocodedAddress | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [opacity, setOpacity] = useState(70)

  const [livePoints, setLivePoints] = useState<[number, number][]>([])
  const [redoStack, setRedoStack] = useState<[number, number][]>([])
  const [liveHectares, setLiveHectares] = useState<number>(0)
  const [prospectiveHa, setProspectiveHa] = useState<number>(0)
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null)
  const [screenCoords, setScreenCoords] = useState<{ x: number; y: number }[]>([])
  const [screenCursor, setScreenCursor] = useState<{ x: number; y: number } | null>(null)

  const [savedCoords, setSavedCoords] = useState<[number, number][]>(() => {
    if (activePoly && activePoly.geometry.coordinates[0]?.length >= 3) {
      return activePoly.geometry.coordinates[0].slice(0, -1) as [number, number][]
    }
    return []
  })
  const [savedScreenCoords, setSavedScreenCoords] = useState<{ x: number; y: number }[]>([])
  const [savedHa, setSavedHa] = useState<number>(() => {
    if (activePoly) {
      return area(activePoly as unknown as Parameters<typeof area>[0]) / 10000
    }
    return 0
  })

  const livePointsRef = useRef(livePoints)
  const redoStackRef = useRef(redoStack)
  const savedCoordsRef = useRef(savedCoords)
  const drawingRef = useRef(drawing)

  useEffect(() => {
    livePointsRef.current = livePoints
  }, [livePoints])

  useEffect(() => {
    redoStackRef.current = redoStack
  }, [redoStack])

  useEffect(() => {
    savedCoordsRef.current = savedCoords
  }, [savedCoords])

  useEffect(() => {
    drawingRef.current = drawing
  }, [drawing])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (activePoly && activePoly.geometry.coordinates[0]?.length >= 3) {
      const pts = activePoly.geometry.coordinates[0].slice(0, -1) as [number, number][]
      setSavedCoords(pts)
      const ha = area(activePoly as unknown as Parameters<typeof area>[0]) / 10000
      setSavedHa(ha)
      if (mapRef.current) {
        setSavedScreenCoords(pts.map((p) => mapRef.current!.project(p)))
      }
      if (drawRef.current) {
        drawRef.current.clear()
        try {
          drawRef.current.addFeatures([
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[...pts, pts[0]]],
              },
              properties: { mode: "polygon" },
            },
          ] as unknown as Parameters<typeof drawRef.current.addFeatures>[0][number][])
          drawRef.current.setMode("select")
        } catch {
        }
      }
    } else if (!activePoly && !drawingRef.current) {
      setSavedCoords([])
      setSavedScreenCoords([])
      setSavedHa(0)
      drawRef.current?.clear()
    }
  }, [activePoly])

  useEffect(() => {
    if (!activePoly || !activePoly.geometry || !activePoly.geometry.coordinates[0]?.length) {
      setFieldAddress(null)
      return
    }
    const coords = activePoly.geometry.coordinates[0] as [number, number][]
    const [lng, lat] = computePolygonCentroid(coords)
    reverseGeocode(lng, lat)
      .then((res) => {
        setFieldAddress(res)
      })
      .catch(() => {
        setFieldAddress(null)
      })
  }, [activePoly])

  const projectPoints = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    if (livePointsRef.current.length > 0) {
      setScreenCoords(livePointsRef.current.map((p) => map.project(p)))
    } else {
      setScreenCoords([])
    }

    if (savedCoordsRef.current.length > 0) {
      setSavedScreenCoords(savedCoordsRef.current.map((p) => map.project(p)))
    } else {
      setSavedScreenCoords([])
    }

    if (cursorPos) {
      setScreenCursor(map.project(cursorPos))
    }
  }, [cursorPos])

  useEffect(() => {
    projectPoints()
  }, [livePoints, savedCoords, cursorPos, projectPoints])

  useEffect(() => {
    if (!containerRef.current) return

    const initialCenter: [number, number] =
      savedCoords.length > 0 ? savedCoords[0] : [78.96, 20.59]
    const initialZoom = savedCoords.length > 0 ? 15 : 4

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 4,
      maxZoom: 21.5,
      maxTileCacheSize: 1200,
      maxTileCacheZoomLevels: 8,
      refreshExpiredTiles: false,
      fadeDuration: 0,
      cancelPendingTileRequestsWhileZooming: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right")
    mapRef.current = map

    map.on("load", () => {
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode({
            styles: {
              fillColor: "#2563EB",
              fillOpacity: 0.18,
              outlineColor: "#2563EB",
              outlineWidth: 2.5,
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
              selectedPolygonColor: "#2563EB",
              selectedPolygonFillOpacity: 0.22,
              selectedPolygonOutlineColor: "#2563EB",
              selectedPolygonOutlineWidth: 2.5,
            },
          }),
        ],
      })

      draw.start()
      drawRef.current = draw

      if (savedCoords.length >= 3) {
        const poly: FieldPolygon = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[...savedCoords, savedCoords[0]]],
          },
          properties: {},
        }
        draw.addFeatures([poly as unknown as Parameters<typeof draw.addFeatures>[0][number]])
        draw.setMode("select")
      }

      draw.on("change", () => {
        if (drawingRef.current) return
        const polygons = draw.getSnapshot().filter((f) => f.geometry.type === "Polygon")
        if (polygons.length > 0) {
          const last = polygons[polygons.length - 1] as unknown as FieldPolygon
          const hectares = area(last as unknown as Parameters<typeof area>[0]) / 10000
          setSavedHa(hectares)
          const coords = last.geometry.coordinates[0].slice(0, -1) as [number, number][]
          setSavedCoords(coords)
          onChangeRef.current(last, hectares)
        }
      })
    })

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!drawingRef.current) return
      uiSoundEngine.playTick(1.0)
      setRedoStack([])
      const next: [number, number][] = [...livePointsRef.current, [e.lngLat.lng, e.lngLat.lat]]
      setLivePoints(next)

      if (next.length >= 3) {
        const tempPoly: FieldPolygon = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[...next, next[0]]],
          },
          properties: {},
        }
        const tempHa = area(tempPoly as unknown as Parameters<typeof area>[0]) / 10000
        setLiveHectares(tempHa)
        onChangeRef.current(tempPoly, tempHa)
      }
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!drawingRef.current) return
      const cur: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      setCursorPos(cur)
      setScreenCursor(e.point)

      const pts = livePointsRef.current
      if (pts.length >= 2) {
        const previewPoly: FieldPolygon = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[...pts, cur, pts[0]]],
          },
          properties: {},
        }
        const ha = area(previewPoly as unknown as Parameters<typeof area>[0]) / 10000
        setProspectiveHa(ha)
      }
    }

    const handleMapRepaint = () => {
      const currentMap = mapRef.current
      if (!currentMap) return
      if (livePointsRef.current.length > 0) {
        setScreenCoords(livePointsRef.current.map((p) => currentMap.project(p)))
      }
      if (savedCoordsRef.current.length > 0) {
        setSavedScreenCoords(savedCoordsRef.current.map((p) => currentMap.project(p)))
      }
    }

    map.on("click", handleMapClick)
    map.on("mousemove", handleMouseMove)
    map.on("move", handleMapRepaint)
    map.on("zoom", handleMapRepaint)

    return () => {
      map.off("click", handleMapClick)
      map.off("mousemove", handleMouseMove)
      map.off("move", handleMapRepaint)
      map.off("zoom", handleMapRepaint)
      drawRef.current?.stop()
      drawRef.current = null
      locationMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const isSat = basemap === "satellite"
    const updateLayers = () => {
      if (map.getLayer("satellite")) {
        map.setLayoutProperty("satellite", "visibility", isSat ? "visible" : "none")
      }
      if (map.getLayer("streets")) {
        map.setLayoutProperty("streets", "visibility", isSat ? "none" : "visible")
      }
    }
    if (map.getLayer("satellite") || map.getLayer("streets")) {
      updateLayers()
    } else {
      map.once("load", updateLayers)
    }
  }, [basemap])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    nasaLayers.forEach((l) => {
      const id = `nasa-${l.id}`
      if (!map.getLayer(id)) return
      map.setLayoutProperty(id, "visibility", active[l.id] ? "visible" : "none")
      map.setPaintProperty(id, "raster-opacity", opacity / 100)
    })
  }, [active, opacity])

  const undoLastPoint = useCallback(() => {
    if (livePointsRef.current.length === 0) return
    const last = livePointsRef.current[livePointsRef.current.length - 1]
    const next = livePointsRef.current.slice(0, -1)
    setRedoStack((prev) => [...prev, last])
    setLivePoints(next)
    uiSoundEngine.playTick(0.85)

    if (next.length >= 3) {
      const tempPoly: FieldPolygon = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...next, next[0]]],
        },
        properties: {},
      }
      const tempHa = area(tempPoly as unknown as Parameters<typeof area>[0]) / 10000
      setLiveHectares(tempHa)
      onChangeRef.current(tempPoly, tempHa)
    } else {
      setLiveHectares(0)
    }
  }, [])

  const redoLastPoint = useCallback(() => {
    if (redoStackRef.current.length === 0) return
    const last = redoStackRef.current[redoStackRef.current.length - 1]
    const nextRedo = redoStackRef.current.slice(0, -1)
    const next = [...livePointsRef.current, last]
    setRedoStack(nextRedo)
    setLivePoints(next)
    uiSoundEngine.playTick(1.15)

    if (next.length >= 3) {
      const tempPoly: FieldPolygon = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...next, next[0]]],
        },
        properties: {},
      }
      const tempHa = area(tempPoly as unknown as Parameters<typeof area>[0]) / 10000
      setLiveHectares(tempHa)
      onChangeRef.current(tempPoly, tempHa)
    }
  }, [])

  const completeDrawing = useCallback(() => {
    if (livePointsRef.current.length < 3) return
    const pts = [...livePointsRef.current]
    const finalPoly: FieldPolygon = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[...pts, pts[0]]],
      },
      properties: {},
    }
    const ha = area(finalPoly as unknown as Parameters<typeof area>[0]) / 10000
    onChangeRef.current(finalPoly, ha)

    uiSoundEngine.playTick(1.3)
    setSavedCoords(pts)
    setSavedHa(ha)

    if (mapRef.current) {
      mapRef.current.doubleClickZoom.enable()
      setSavedScreenCoords(pts.map((p) => mapRef.current!.project(p)))
    }

    if (drawRef.current) {
      drawRef.current.clear()
      drawRef.current.addFeatures([
        finalPoly as unknown as Parameters<typeof drawRef.current.addFeatures>[0][number],
      ])
      drawRef.current.setMode("select")
    }

    setDrawing(false)
    setLivePoints([])
    setScreenCoords([])
    setRedoStack([])
    setMessage("")
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawingRef.current) return

      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey

      if (isCtrlOrMeta && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        undoLastPoint()
        return
      }

      if (
        (isCtrlOrMeta && (e.key === "y" || e.key === "Y")) ||
        (isCtrlOrMeta && e.shiftKey && (e.key === "z" || e.key === "Z"))
      ) {
        e.preventDefault()
        redoLastPoint()
        return
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault()
        undoLastPoint()
        return
      }

      if (e.key === "Enter") {
        e.preventDefault()
        if (livePointsRef.current.length >= 3) {
          completeDrawing()
        }
        return
      }

      if (e.key === "Escape") {
        e.preventDefault()
        if (mapRef.current) {
          mapRef.current.doubleClickZoom.enable()
        }
        setDrawing(false)
        setLivePoints([])
        setRedoStack([])
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undoLastPoint, redoLastPoint, completeDrawing])

  const resumeDrawing = useCallback(() => {
    if (!drawRef.current) return
    uiSoundEngine.playChipClickSfx()
    if (mapRef.current) {
      mapRef.current.doubleClickZoom.disable()
    }
    const existing =
      savedCoordsRef.current.length > 0 ? savedCoordsRef.current : livePointsRef.current
    drawRef.current.clear()
    drawRef.current.setMode("select")
    setLivePoints([...existing])
    setRedoStack([])
    setSavedCoords([])
    setSavedScreenCoords([])
    setSavedHa(0)
    setDrawing(true)
    setMessage("Click anywhere on map to add more corners. Click 'Done' or press Enter to finish.")
  }, [])

  useEffect(() => {
    const handleResume = () => {
      resumeDrawing()
    }
    window.addEventListener("fieldshift-resume-drawing", handleResume)
    return () => window.removeEventListener("fieldshift-resume-drawing", handleResume)
  }, [resumeDrawing])

  const startDrawing = () => {
    if (!drawRef.current) return
    uiSoundEngine.playTick(1.1)
    if (mapRef.current) {
      mapRef.current.doubleClickZoom.disable()
    }
    drawRef.current.clear()
    drawRef.current.setMode("select")
    setLivePoints([])
    setRedoStack([])
    setScreenCoords([])
    setSavedCoords([])
    setSavedScreenCoords([])
    setDrawing(true)
    setMessage("Click each corner of your field boundary. Add as many corners as needed, then click 'Done'.")
  }

  const clearField = () => {
    uiSoundEngine.playTick(0.8)
    if (mapRef.current) {
      mapRef.current.doubleClickZoom.enable()
    }
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
    setFieldAddress(null)
    setMessage("")
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

  const activeCount = Object.values(active).filter(Boolean).length

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border-2 border-[#CFC6B2] bg-[#E8E2D4] shadow-[0_8px_24px_rgba(35,31,24,0.10)]">
      <div
        ref={containerRef}
        className={`h-full w-full transition-all duration-300 ${drawing ? "cursor-crosshair" : ""}`}
      />

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

      <svg className="pointer-events-none absolute inset-0 z-15 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="glassFieldFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.03" />
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
              strokeDasharray="3 6"
              className="animate-field-dash-reverse"
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
                <rect
                  x="-28"
                  y="-11"
                  width="56"
                  height="22"
                  rx="6"
                  fill="#182016"
                  stroke="rgba(230, 224, 210, 0.25)"
                  strokeWidth="1"
                  opacity="0.95"
                />
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
              <rect
                x="9"
                y="-12"
                width="18"
                height="15"
                rx="4"
                fill="#182016"
                stroke="rgba(230, 224, 210, 0.3)"
                strokeWidth="1"
              />
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
                <rect
                  x="-24"
                  y="-9"
                  width="48"
                  height="18"
                  rx="4"
                  fill="#182016"
                  stroke="rgba(230, 224, 210, 0.25)"
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text x="0" y="3" fill="#F4F0E6" fontSize="9" fontWeight="600" textAnchor="middle">
                  {formatDist(dist)}
                </text>
              </g>
            )
          })}

        {!drawing && savedScreenCoords.length >= 3 && savedCoords.length >= 3 && (
          <>
            <polygon
              points={savedScreenCoords.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#3B82F6"
              strokeWidth="2.2"
              strokeDasharray="6 4"
              className="animate-field-dash"
            />
            <polygon
              points={savedScreenCoords.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="1"
            />
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
                    <rect
                      x="8"
                      y="-11"
                      width="16"
                      height="14"
                      rx="3"
                      fill="#182016"
                      stroke="rgba(230, 224, 210, 0.3)"
                      strokeWidth="1"
                    />
                    <text x="16" y="-1" fill="#F4F0E6" fontSize="9" fontWeight="bold" textAnchor="middle">
                      {i + 1}
                    </text>
                  </g>
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-24"
                      y="-8"
                      width="48"
                      height="16"
                      rx="4"
                      fill="#182016"
                      stroke="rgba(230, 224, 210, 0.25)"
                      strokeWidth="1"
                      opacity="0.95"
                    />
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
          className="h-10 flex-1 rounded-xl border border-[rgba(230,224,210,0.22)] bg-[rgba(34,32,28,0.84)] backdrop-blur-md px-3.5 text-xs text-[#F4F0E6] placeholder-[#A8A396] shadow-sm outline-none focus:border-[#7E9167] focus:ring-1 focus:ring-[#7E9167]"
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 rounded-xl bg-[#7E9167] text-[#161C14] hover:bg-[#8FA882] shadow-sm cursor-pointer"
          aria-label="Search"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={locateMe}
          disabled={locating}
          className="h-10 w-10 rounded-xl bg-[rgba(34,32,28,0.84)] text-[#F4F0E6] border border-[rgba(230,224,210,0.22)] hover:bg-white/10 shadow-sm cursor-pointer"
          aria-label="Find my GPS location"
          title="Find my GPS location"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse text-blue-400" : ""}`} />
        </Button>
      </form>

      <AnimatePresence>
        {drawing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.16 }}
            className="absolute top-16 left-3 right-3 z-20 mx-auto max-w-lg rounded-2xl bg-[rgba(34,32,28,0.88)] backdrop-blur-xl p-3.5 text-[#F4F0E6] shadow-2xl border border-[rgba(230,224,210,0.22)]"
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
                  <span className="text-[10px] text-[#A8A396]">
                    (Est: {prospectiveHa.toFixed(2)} ha)
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] text-[#A8A396]">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">
                    Ctrl+Z
                  </kbd>{" "}
                  Undo
                </span>
                <span>
                  <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">
                    Ctrl+Y
                  </kbd>{" "}
                  Redo
                </span>
                <span>
                  <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">
                    Enter
                  </kbd>{" "}
                  Finish
                </span>
                <span>
                  <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">
                    Delete
                  </kbd>
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={undoLastPoint}
                  disabled={livePoints.length === 0}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#F4F0E6] hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <RotateCcwIcon className="h-3 w-3" />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={redoLastPoint}
                  disabled={redoStack.length === 0}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#F4F0E6] hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Redo
                </button>
                <button
                  type="button"
                  onClick={completeDrawing}
                  disabled={livePoints.length < 3}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-md disabled:opacity-40 transition-all cursor-pointer"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Done ({livePoints.length} {livePoints.length === 1 ? "corner" : "corners"})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!drawing && savedCoords.length >= 3 && (
        <div className="absolute top-16 left-3 z-20 flex items-center gap-2 rounded-xl bg-[rgba(34,32,28,0.88)] backdrop-blur-xl px-3.5 py-2 text-xs font-semibold text-[#F4F0E6] shadow-md border border-[rgba(230,224,210,0.22)]">
          <MapPinIcon className="h-4 w-4 text-blue-400" />
          <span>
            Active boundary • {savedHa.toFixed(2)} ha ({savedCoords.length} corners)
          </span>
          {fieldAddress && (
            <span className="text-[#A8A396] text-[11px] pl-1 border-l border-white/20">
              {fieldAddress.formatted}
            </span>
          )}
          <button
            type="button"
            onClick={resumeDrawing}
            className="ml-2 px-3 py-1 rounded-lg bg-[#5E7A46] text-[#F7F4EC] hover:bg-[#6E8F53] text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add corners
          </button>
        </div>
      )}

      {message && (
        <p className="absolute left-3 top-28 z-20 rounded-lg bg-[rgba(34,32,28,0.88)] backdrop-blur-xl px-3 py-1.5 text-xs text-[#F4F0E6] shadow-md border border-[rgba(230,224,210,0.22)]">
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

      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startDrawing}
          className={`h-10 px-4 flex items-center justify-center rounded-xl text-xs transition-all shadow-md cursor-pointer ${
            drawing
              ? "bg-blue-600 text-white font-bold border border-blue-400 shadow-lg"
              : "bg-[#7E9167] text-[#141A12] font-semibold border border-[#96A87E] hover:bg-[#8FA882]"
          }`}
        >
          <PencilIcon className="mr-1.5 h-3.5 w-3.5" />
          {drawing ? "Marking field…" : savedCoords.length >= 3 ? "Draw new field" : "Draw field"}
        </button>

        {drawing && (
          <button
            type="button"
            onClick={completeDrawing}
            disabled={livePoints.length < 3}
            className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-40 transition-all cursor-pointer border border-blue-400"
          >
            <CheckIcon className="h-4 w-4" />
            Done ({livePoints.length} {livePoints.length === 1 ? "corner" : "corners"})
          </button>
        )}

        {!drawing && savedCoords.length >= 3 && (
          <button
            type="button"
            onClick={resumeDrawing}
            className="h-10 px-3.5 flex items-center justify-center rounded-xl text-xs font-bold bg-[#5E7A46] text-[#F7F4EC] hover:bg-[#6E8F53] border border-[#4B6338] shadow-md transition-all cursor-pointer"
          >
            <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
            Add corners
          </button>
        )}

        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="h-10 px-3.5 flex items-center justify-center rounded-xl text-xs font-medium bg-[rgba(34,32,28,0.84)] backdrop-blur-md border border-[rgba(230,224,210,0.22)] text-[#F2EDE2] hover:bg-white/10 shadow-sm transition-all cursor-pointer"
          title="Use your device GPS to center the map on your location"
        >
          <LocateFixed className={`mr-1.5 h-3.5 w-3.5 ${locating ? "animate-pulse text-blue-400" : ""}`} />
          {locating ? "Locating…" : "My location"}
        </button>

        <button
          type="button"
          onClick={clearField}
          className="h-10 px-3.5 flex items-center justify-center rounded-xl text-xs font-medium bg-[rgba(34,32,28,0.84)] backdrop-blur-md border border-[rgba(230,224,210,0.22)] text-[#F2EDE2] hover:bg-[#A66843]/40 hover:border-[#A66843]/60 shadow-sm transition-all cursor-pointer"
        >
          <TrashIcon className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </button>

        <button
          type="button"
          onClick={() => {
            uiSoundEngine.playChipClickSfx()
            setBasemap((prev) => (prev === "satellite" ? "streets" : "satellite"))
          }}
          className={`h-10 px-3.5 flex items-center justify-center rounded-xl text-xs font-medium backdrop-blur-md border shadow-sm transition-all cursor-pointer ${
            basemap === "streets"
              ? "bg-[#7E9167] text-[#141A12] font-bold border-[#96A87E]"
              : "bg-[rgba(34,32,28,0.84)] border-[rgba(230,224,210,0.22)] text-[#F2EDE2] hover:bg-white/10"
          }`}
        >
          <LayersIcon className="mr-1.5 h-3.5 w-3.5" />
          {basemap === "satellite" ? "Street map" : "Satellite"}
        </button>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className={`h-10 px-3.5 flex items-center justify-center rounded-xl text-xs font-medium backdrop-blur-md border shadow-sm transition-all cursor-pointer ${
            panelOpen
              ? "bg-[#7E9167] text-[#141A12] font-bold border-[#96A87E]"
              : "bg-[rgba(34,32,28,0.84)] border-[rgba(230,224,210,0.22)] text-[#F2EDE2] hover:bg-white/10"
          }`}
          aria-expanded={panelOpen}
        >
          <SatelliteIcon className="mr-1.5 h-3.5 w-3.5" />
          NASA layers{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>
    </div>
  )
}
