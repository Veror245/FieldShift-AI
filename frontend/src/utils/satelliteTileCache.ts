import type * as maplibregl from "maplibre-gl"

const CACHE_NAME = "fieldshift-map-tiles-v3"
const MAX_LRU_ENTRIES = 500

class TileLruCache {
  private cache = new Map<string, ArrayBuffer>()

  get(key: string): ArrayBuffer | undefined {
    const item = this.cache.get(key)
    if (item) {
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: string, value: ArrayBuffer): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= MAX_LRU_ENTRIES) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    this.cache.set(key, value)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

const ramTileCache = new TileLruCache()
let protocolRegistered = false

export function initSatelliteTileProtocol(maplibre: typeof maplibregl): void {
  if (protocolRegistered || typeof window === "undefined") return

  try {
    maplibre.addProtocol("cached-sat", async (params, abortController) => {
      const targetUrl = params.url.replace(/^cached-sat:\/\//, "https://")

      const ramHit = ramTileCache.get(targetUrl)
      if (ramHit) {
        return { data: ramHit }
      }

      let diskCache: Cache | null = null
      if ("caches" in window) {
        try {
          diskCache = await caches.open(CACHE_NAME)
          const matched = await diskCache.match(targetUrl)
          if (matched && matched.ok) {
            const buf = await matched.arrayBuffer()
            if (buf && buf.byteLength > 200) {
              ramTileCache.set(targetUrl, buf)
              return { data: buf }
            }
          }
        } catch {
        }
      }

      const res = await fetch(targetUrl, {
        signal: abortController.signal,
        mode: "cors",
        credentials: "omit",
      })

      if (!res.ok) {
        throw new Error(`Failed to load tile: ${res.status}`)
      }

      const clone = res.clone()
      const buf = await res.arrayBuffer()

      if (targetUrl.includes("arcgisonline.com") && buf.byteLength < 2500) {
        throw new Error("Esri blank placeholder tile rejected")
      }

      ramTileCache.set(targetUrl, buf)

      if (diskCache) {
        diskCache.put(targetUrl, clone).catch(() => {})
      }

      return { data: buf }
    })

    protocolRegistered = true
  } catch {
  }
}

function lngLatToTile(lng: number, lat: number, zoom: number): { x: number; y: number; z: number } {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n)
  return { x, y, z: zoom }
}

const WEST_BENGAL_KEY_POINTS = [
  { name: "Burdwan Farmland", lng: 87.86, lat: 23.23 },
  { name: "Nadia Alluvial", lng: 88.53, lat: 23.47 },
  { name: "Hooghly Rice Delta", lng: 88.24, lat: 22.90 },
  { name: "North 24 Parganas Fields", lng: 88.58, lat: 22.72 },
  { name: "South Bengal Delta", lng: 88.36, lat: 22.30 },
]

export function prewarmWestBengalTiles(): void {
  if (typeof window === "undefined" || !("caches" in window)) return

  const warmAction = async () => {
    try {
      const cache = await caches.open(CACHE_NAME)
      const zooms = [12, 13, 14, 15]
      const subdomains = ["mt0", "mt1", "mt2", "mt3"]
      let subIdx = 0

      for (const pt of WEST_BENGAL_KEY_POINTS) {
        for (const z of zooms) {
          const { x, y } = lngLatToTile(pt.lng, pt.lat, z)
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const tileX = x + dx
              const tileY = y + dy
              const sub = subdomains[subIdx % subdomains.length]
              subIdx++
              const url = `https://${sub}.google.com/vt/lyrs=s&hl=en&x=${tileX}&y=${tileY}&z=${z}&scale=2`

              const exists = await cache.match(url)
              if (!exists) {
                fetch(url, { mode: "cors", credentials: "omit" })
                  .then((res) => {
                    if (res.ok) {
                      cache.put(url, res)
                    }
                  })
                  .catch(() => {})
                await new Promise((r) => setTimeout(r, 35))
              }
            }
          }
        }
      }
    } catch {
    }
  }

  if ("requestIdleCallback" in window) {
    ;(window as unknown as { requestIdleCallback: (fn: () => void) => void }).requestIdleCallback(() => {
      warmAction()
    })
  } else {
    setTimeout(warmAction, 1500)
  }
}

export async function clearTileCache(): Promise<void> {
  ramTileCache.clear()
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      await caches.delete(CACHE_NAME)
    } catch {
    }
  }
}
