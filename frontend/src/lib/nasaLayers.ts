export type NasaLayer = {
  id: string
  label: string
  description: string
  layer: string // NASA GIBS layer name
  matrix: string // tile matrix set
  maxZoom: number
  ext: "png" | "jpg"
  lagDays: number // how many days back to request, because data is published with a delay
}

// If a layer shows nothing on the map, edit its line here (layer name, matrix or lagDays).
export const nasaLayers: NasaLayer[] = [
  {
    id: "rain",
    label: "Rainfall rate",
    description: "GPM IMERG precipitation estimate, coarse (about 10 km).",
    layer: "IMERG_Precipitation_Rate",
    matrix: "GoogleMapsCompatible_Level6",
    maxZoom: 6,
    ext: "png",
    lagDays: 3,
  },
  {
    id: "ndvi",
    label: "Vegetation greenness (NDVI)",
    description: "MODIS vegetation index, moderate resolution.",
    layer: "MODIS_Terra_NDVI_8Day",
    matrix: "GoogleMapsCompatible_Level9",
    maxZoom: 9,
    ext: "png",
    lagDays: 16,
  },
  {
    id: "lst",
    label: "Land surface temperature",
    description: "MODIS daytime land surface temperature, about 1 km.",
    layer: "MODIS_Terra_Land_Surface_Temp_Day",
    matrix: "GoogleMapsCompatible_Level7",
    maxZoom: 7,
    ext: "png",
    lagDays: 5,
  },
]

export const dateFor = (lagDays: number) =>
  new Date(Date.now() - lagDays * 86400000).toISOString().slice(0, 10)

export const tileUrl = (l: NasaLayer) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${l.layer}/default/${dateFor(l.lagDays)}/${l.matrix}/{z}/{y}/{x}.${l.ext}`
