import type { FieldPolygon } from "@/types/geojson"

const W = 200
const H = 140
const PAD = 16

export default function FieldShape({
  polygon,
  className = "",
}: {
  polygon: FieldPolygon
  className?: string
}) {
  const ring = polygon.geometry.coordinates[0]
  const midLat = ring.reduce((a, p) => a + p[1], 0) / ring.length
  const k = Math.cos((midLat * Math.PI) / 180)
  const pts = ring.map((p) => ({ x: p[0] * k, y: -p[1] }))

  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const w = Math.max(...xs) - minX || 1e-9
  const h = Math.max(...ys) - minY || 1e-9
  const scale = Math.min((W - PAD * 2) / w, (H - PAD * 2) / h)
  const offX = (W - w * scale) / 2
  const offY = (H - h * scale) / 2

  const points = pts
    .map((p) => `${((p.x - minX) * scale + offX).toFixed(1)},${((p.y - minY) * scale + offY).toFixed(1)}`)
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label="Outline of your field"
    >
      <rect width={W} height={H} rx="12" fill="#1E3A2F10" />
      <polygon
        points={points}
        fill="#1E3A2F"
        fillOpacity="0.25"
        stroke="#E08E45"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}