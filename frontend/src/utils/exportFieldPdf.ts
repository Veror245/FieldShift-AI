import type { FieldPolygon } from "@/types/geojson"
import type { GeocodedAddress } from "@/utils/reverseGeocode"
import { formatCoordinates } from "@/utils/reverseGeocode"

export type FieldPdfExportData = {
  farmName?: string
  polygon: FieldPolygon | null
  hectares: number
  coordinates: { lat: number; lng: number } | null
  address: GeocodedAddress | null
}

function generateFieldSvgString(polygon: FieldPolygon | null, width = 340, height = 220, pad = 24): string {
  if (!polygon || !polygon.geometry || !polygon.geometry.coordinates[0]?.length) {
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <text x="${width / 2}" y="${height / 2}" fill="#64748B" font-family="system-ui, sans-serif" font-size="12" font-weight="500" text-anchor="middle">
          GPS Point Location (No boundary drawn)
        </text>
      </svg>
    `
  }

  const ring = polygon.geometry.coordinates[0] as [number, number][]
  const midLat = ring.reduce((a, p) => a + p[1], 0) / ring.length
  const k = Math.cos((midLat * Math.PI) / 180)
  const pts = ring.map((p) => ({ x: p[0] * k, y: -p[1] }))

  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const w = Math.max(...xs) - minX || 1e-9
  const h = Math.max(...ys) - minY || 1e-9
  const scale = Math.min((width - pad * 2) / w, (height - pad * 2) / h)
  const offX = (width - w * scale) / 2
  const offY = (height - h * scale) / 2

  const points = pts
    .map((p) => `${((p.x - minX) * scale + offX).toFixed(1)},${((p.y - minY) * scale + offY).toFixed(1)}`)
    .join(" ")

  const cornerMarkers = pts.slice(0, -1).map((p, i) => {
    const cx = ((p.x - minX) * scale + offX).toFixed(1)
    const cy = ((p.y - minY) * scale + offY).toFixed(1)
    return `
      <circle cx="${cx}" cy="${cy}" r="5.5" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
      <rect x="${Number(cx) + 7}" y="${Number(cy) - 9}" width="15" height="13" rx="3.5" fill="#182016" opacity="0.95"/>
      <text x="${Number(cx) + 14.5}" y="${Number(cy) + 0.5}" fill="#F4F0E6" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">${i + 1}</text>
    `
  }).join("")

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pdfFieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#2563EB" stop-opacity="0.10"/>
        </linearGradient>
        <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" stroke-width="0.8"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
      <rect width="${width}" height="${height}" rx="12" fill="url(#gridPattern)"/>
      <polygon points="${points}" fill="url(#pdfFieldGrad)" stroke="#2563EB" stroke-width="2.5" stroke-linejoin="round"/>
      ${cornerMarkers}
    </svg>
  `
}

export function buildFieldLocationJson(data: FieldPdfExportData): string {
  const corners = data.polygon ? data.polygon.geometry.coordinates[0].length - 1 : 0
  const jsonPayload = {
    farmName: data.farmName || "Field Assessment",
    timestamp: new Date().toISOString(),
    latitude: data.coordinates?.lat ?? null,
    longitude: data.coordinates?.lng ?? null,
    formattedCoordinates: data.coordinates
      ? formatCoordinates(data.coordinates.lat, data.coordinates.lng)
      : null,
    location: {
      village: data.address?.village ?? null,
      city: data.address?.city ?? null,
      district: data.address?.district ?? null,
      state: data.address?.state ?? null,
      country: data.address?.country ?? null,
      formattedAddress: data.address?.formatted ?? null,
    },
    field: {
      areaHectares: Number(data.hectares.toFixed(2)),
      cornersCount: corners,
      coordinates: data.polygon?.geometry.coordinates[0] ?? [],
    },
  }
  return JSON.stringify(jsonPayload, null, 2)
}

export function exportFieldPdf(data: FieldPdfExportData): boolean {
  const printWindow = window.open("", "_blank", "width=900,height=980")
  if (!printWindow) {
    return false
  }

  const corners = data.polygon ? data.polygon.geometry.coordinates[0].length - 1 : 0
  const coordFormatted = data.coordinates
    ? formatCoordinates(data.coordinates.lat, data.coordinates.lng)
    : "Not available"
  const latStr = data.coordinates ? data.coordinates.lat.toFixed(6) : "N/A"
  const lngStr = data.coordinates ? data.coordinates.lng.toFixed(6) : "N/A"
  const svgMap = generateFieldSvgString(data.polygon, 360, 240)
  const jsonContent = buildFieldLocationJson(data)
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Field Boundary & Geospatial Report - ${data.farmName || "Field Assessment"}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      line-height: 1.5;
      padding: 24px;
    }
    .no-print-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1E293B;
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .no-print-bar button {
      background: #2563EB;
      color: #FFFFFF;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      margin-left: 8px;
    }
    .no-print-bar button.secondary {
      background: #334155;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
    .header {
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563EB;
      margin-bottom: 4px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #0F172A;
    }
    .meta {
      font-size: 12px;
      color: #64748B;
      text-align: right;
    }
    .top-grid {
      display: grid;
      grid-template-columns: 1fr 370px;
      gap: 20px;
      align-items: start;
      margin-bottom: 24px;
    }
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 18px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      margin-bottom: 12px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #F1F5F9;
      font-size: 13px;
    }
    .stat-row:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #64748B;
    }
    .stat-value {
      font-weight: 600;
      color: #0F172A;
    }
    .highlight-stat {
      background: #EFF6FF;
      border-radius: 8px;
      padding: 8px 12px;
      margin: 10px 0;
    }
    .highlight-stat .stat-label {
      color: #1D4ED8;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .highlight-stat .stat-value {
      font-size: 15px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #1E40AF;
    }
    .shape-container {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }
    .shape-container .shape-caption {
      font-size: 11px;
      color: #64748B;
      margin-top: 8px;
      font-weight: 500;
    }
    .location-box {
      margin-bottom: 24px;
    }
    .location-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .json-box {
      background: #0F172A;
      color: #E2E8F0;
      border-radius: 10px;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      margin-top: 24px;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Field Boundary & Geospatial PDF Export</strong>
      <span style="opacity: 0.7; margin-left: 8px; font-size: 12px;">Ready to save or print</span>
    </div>
    <div>
      <button class="secondary" onclick="window.close()">Close</button>
      <button onclick="window.print()">Save as PDF / Print</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="brand">FieldShift Geospatial Intelligence</div>
      <h1 class="title">${data.farmName || "Field Assessment"}</h1>
    </div>
    <div class="meta">
      <div>Report Date: ${dateStr}</div>
      <div>Boundary Type: ${data.polygon ? "Vector Polygon" : "GPS Pin"}</div>
    </div>
  </div>

  <div class="top-grid">
    <div class="card">
      <div class="card-title">Geospatial Metrics</div>
      <div class="stat-row">
        <span class="stat-label">Area</span>
        <span class="stat-value">${data.hectares.toFixed(2)} hectares (${(data.hectares * 2.47105).toFixed(2)} acres)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Corners Marked</span>
        <span class="stat-value">${corners} vertices</span>
      </div>

      <div class="highlight-stat">
        <div class="stat-label">Latitude & Longitude (Coordinates)</div>
        <div class="stat-value">${coordFormatted}</div>
      </div>

      <div class="stat-row">
        <span class="stat-label">Decimal Latitude</span>
        <span class="stat-value" style="font-family: ui-monospace, monospace;">${latStr}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Decimal Longitude</span>
        <span class="stat-value" style="font-family: ui-monospace, monospace;">${lngStr}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Coordinate System</span>
        <span class="stat-value">WGS84 (EPSG:4326)</span>
      </div>
    </div>

    <div class="shape-container">
      <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px; text-align: left;">
        Mapped Field Boundary (Exact Shape)
      </div>
      ${svgMap}
      <div class="shape-caption">
        Exact outline of field with vertex indices and orientation
      </div>
    </div>
  </div>

  <div class="card location-box">
    <div class="card-title">Mapped Area Location & Address</div>
    <div class="location-grid">
      <div class="stat-row">
        <span class="stat-label">Village / Town</span>
        <span class="stat-value">${data.address?.village || "Unspecified"}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">City / Region</span>
        <span class="stat-value">${data.address?.city || "Unspecified"}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">District</span>
        <span class="stat-value">${data.address?.district || "Unspecified"}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">State / Province</span>
        <span class="stat-value">${data.address?.state || "Unspecified"}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Country</span>
        <span class="stat-value">${data.address?.country || "India"}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Exact Coordinates</span>
        <span class="stat-value" style="font-family: ui-monospace, monospace;">${coordFormatted}</span>
      </div>
    </div>
    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #E2E8F0; font-size: 12px;">
      <span style="color: #64748B;">Full Address: </span>
      <span style="font-weight: 600; color: #0F172A;">${data.address?.formatted || coordFormatted}</span>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Machine-Readable Location Data (JSON Format)</div>
    <div class="json-box">${escapeHtml(jsonContent)}</div>
  </div>

  <div class="footer">
    <div>FieldShift Agricultural Intelligence System</div>
    <div>WGS84 EPSG:4326 Latitude / Longitude Mapping</div>
  </div>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    try {
      printWindow.print()
    } catch {
    }
  }, 450)

  return true
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
