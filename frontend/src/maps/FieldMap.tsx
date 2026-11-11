import { useEffect, useRef, useState, useCallback } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import area from "@turf/area"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckIcon,
  LayersIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/common/Icons"
import { Button } from "@/components/ui/button"
import { uiSoundEngine } from "@/utils/uiSoundEngine"
import { initSatelliteTileProtocol, prewarmWestBengalTiles } from "@/utils/satelliteTileCache"
import type { FieldPolygon } from "@/types/geojson"

initSatelliteTileProtocol(maplibregl)

const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "cached-sat://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false",
        "cached-sat://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false",
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
    streets: {
      type: "raster",
      tiles: [
        "cached-sat://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        "cached-sat://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        "cached-sat://mt2.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        "cached-sat://mt3.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: "© Google Maps",
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
      paint: {
        "raster-fade-duration": 0,
      },
    },
    {
      id: "streets",
      type: "raster",
      source: "streets",
      layout: { visibility: "none" },
      paint: {
        "raster-fade-duration": 0,
      },
    },
  ],
}

function distanceMeters(c1?: [number, number], c2?: [number, number]) {
  if (!c1 || !c2 || !Array.isArray(c1) || !Array.isArray(c2)) return 0
  const R = 6371e3
  const p1 = (c1[1] * Math.PI) / 180
  const p2 = (c2[1] * Math.PI) / 180
  const dp = ((c2[1] - c1[1]) * Math.PI) / 180
  const dl = ((c2[0] - c1[0]) * Math.PI) / 180
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatDist(meters: number): string {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(2)} km`
}

type Props = {
  initialPolygon?: FieldPolygon | null
  onChange: (polygon: FieldPolygon | null, hectares: number) => void
}

export default function FieldMap({ initialPolygon, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const onChangeRef = useRef(onChange)

  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite")
  const [drawing, setDrawing] = useState(false)
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")
  const [livePoints, setLivePoints] = useState<[number, number][]>([])
  const [redoStack, setRedoStack] = useState<[number, number][]>([])
  const [liveHectares, setLiveHectares] = useState<number>(0)
  const [prospectiveHa, setProspectiveHa] = useState<number>(0)
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null)
  const [screenCoords, setScreenCoords] = useState<{ x: number; y: number }[]>([])
  const [screenCursor, setScreenCursor] = useState<{ x: number; y: number } | null>(null)

  const [savedCoords, setSavedCoords] = useState<[number, number][]>(() => {
    if (initialPolygon && initialPolygon.geometry.coordinates[0]?.length >= 3) {
      return initialPolygon.geometry.coordinates[0].slice(0, -1) as [number, number][]
    }
    return []
  })
  const [savedScreenCoords, setSavedScreenCoords] = useState<{ x: number; y: number }[]>([])
  const [savedHa, setSavedHa] = useState<number>(() => {
    if (initialPolygon) {
      return area(initialPolygon as unknown as Parameters<typeof area>[0]) / 10000
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

    prewarmWestBengalTiles()

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
    if (typeof window !== "undefined") {
      (window as unknown as { _fieldShiftMap?: maplibregl.Map })._fieldShiftMap = map
    }

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
      drawRef.current.addFeatures([finalPoly as unknown as Parameters<typeof drawRef.current.addFeatures>[0][number]])
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
    const existing = savedCoordsRef.current.length > 0 ? savedCoordsRef.current : livePointsRef.current
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
    <div className="relative h-full w-full overflow-hidden rounded-2xl border-2 border-[#CFC6B2] bg-[#E8E2D4] shadow-[0_8px_24px_rgba(35,31,24,0.10)]">
      <div
        ref={containerRef}
        className={`h-full w-full transition-all duration-300 ${drawing ? "cursor-crosshair" : ""}`}
      />

      <svg className="absolute inset-0 pointer-events-none w-full h-full z-15 overflow-visible">
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
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">Ctrl+Z</kbd> Undo</span>
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">Ctrl+Y</kbd> Redo</span>
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">Enter</kbd> Finish</span>
                <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] text-[#F4F0E6]">⌫</kbd> Delete</span>
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
          <span>Active boundary • {savedHa.toFixed(2)} ha ({savedCoords.length} corners)</span>
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
        <p className="absolute left-3 top-16 z-10 rounded-lg bg-[rgba(34,32,28,0.88)] backdrop-blur-xl px-3 py-1 text-xs text-[#F4F0E6] shadow-md border border-[rgba(230,224,210,0.22)]">
          {message}
        </p>
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
      </div>
    </div>
  )
}
