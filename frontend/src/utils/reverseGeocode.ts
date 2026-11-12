export type GeocodedAddress = {
  village?: string
  city?: string
  district?: string
  state?: string
  country?: string
  formatted: string
}

const cache = new Map<string, GeocodedAddress>()

export function computePolygonCentroid(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [0, 0]
  let sumLng = 0
  let sumLat = 0
  const n = coords.length
  for (let i = 0; i < n; i++) {
    sumLng += coords[i][0]
    sumLat += coords[i][1]
  }
  return [sumLng / n, sumLat / n]
}

function resolveLocalRegion(lng: number, lat: number): GeocodedAddress | null {
  if (lng >= 87.35 && lng <= 87.55 && lat >= 23.38 && lat <= 23.55) {
    return {
      village: "Panagarh",
      city: "Durgapur Region",
      district: "Paschim Bardhaman",
      state: "West Bengal",
      country: "India",
      formatted: "Panagarh, Paschim Bardhaman, West Bengal, India",
    }
  }

  if (lng >= 87.75 && lng <= 88.00 && lat >= 23.18 && lat <= 23.32) {
    return {
      city: "Bardhaman",
      district: "Purba Bardhaman",
      state: "West Bengal",
      country: "India",
      formatted: "Bardhaman, Purba Bardhaman, West Bengal, India",
    }
  }

  if (lng >= 88.25 && lng <= 88.45 && lat >= 22.45 && lat <= 22.65) {
    return {
      city: "Kolkata",
      district: "Kolkata",
      state: "West Bengal",
      country: "India",
      formatted: "Kolkata, West Bengal, India",
    }
  }

  if (lng >= 85.8 && lng <= 89.9 && lat >= 21.5 && lat <= 27.3) {
    return {
      state: "West Bengal",
      country: "India",
      formatted: "West Bengal, India",
    }
  }

  if (lng >= 68.0 && lng <= 97.4 && lat >= 8.0 && lat <= 37.1) {
    let state = "India"
    if (lat >= 28.0 && lat <= 32.5 && lng >= 73.8 && lng <= 77.0) state = "Punjab / Haryana"
    else if (lat >= 23.8 && lat <= 30.5 && lng >= 77.0 && lng <= 84.7) state = "Uttar Pradesh"
    else if (lat >= 15.6 && lat <= 22.0 && lng >= 72.6 && lng <= 80.9) state = "Maharashtra"
    else if (lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.6) state = "Karnataka"
    else if (lat >= 8.0 && lat <= 13.5 && lng >= 76.2 && lng <= 80.3) state = "Tamil Nadu"
    else if (lat >= 20.1 && lat <= 24.7 && lng >= 68.1 && lng <= 74.5) state = "Gujarat"
    else if (lat >= 23.0 && lat <= 30.2 && lng >= 69.5 && lng <= 78.3) state = "Rajasthan"
    else if (lat >= 24.2 && lat <= 27.5 && lng >= 83.3 && lng <= 88.3) state = "Bihar"
    else if (lat >= 8.2 && lat <= 12.8 && lng >= 74.8 && lng <= 77.4) state = "Kerala"
    else if (lat >= 17.7 && lat <= 22.6 && lng >= 81.3 && lng <= 87.5) state = "Odisha"
    return {
      state,
      country: "India",
      formatted: state === "India" ? "India" : `${state}, India`,
    }
  }

  if (lng >= -125.0 && lng <= -66.9 && lat >= 24.4 && lat <= 49.4) {
    return {
      country: "United States",
      formatted: "United States",
    }
  }

  return null
}

export async function reverseGeocode(lng: number, lat: number): Promise<GeocodedAddress> {
  const key = `${lng.toFixed(3)},${lat.toFixed(3)}`
  if (cache.has(key)) {
    return cache.get(key)!
  }

  const local = resolveLocalRegion(lng, lat)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2600)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const village = addr.village || addr.hamlet || addr.isolated_dwelling || addr.neighbourhood
      const city = addr.city || addr.town || addr.municipality || addr.suburb
      const district = addr.county || addr.state_district || addr.district
      const state = addr.state || local?.state
      const country = addr.country || local?.country || "India"

      const parts: string[] = []
      if (village) parts.push(village)
      if (city && city !== village) parts.push(city)
      if (district && district !== city && district !== village) parts.push(district)
      if (state) parts.push(state)
      if (country) parts.push(country)

      const formatted = parts.length > 0 ? parts.join(", ") : (local?.formatted || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`)
      const result: GeocodedAddress = {
        village,
        city,
        district,
        state,
        country,
        formatted,
      }
      cache.set(key, result)
      return result
    }
  } catch {
  }

  const fallback = local || {
    formatted: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
    country: "India",
  }
  cache.set(key, fallback)
  return fallback
}
