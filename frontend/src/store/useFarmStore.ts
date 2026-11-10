import { create } from "zustand"
import type { FieldPolygon } from "@/types/geojson"
import type { FarmProfile } from "@/types/farm"

type FarmState = {
  polygon: FieldPolygon | null
  hectares: number
  profile: FarmProfile | null
  setField: (polygon: FieldPolygon | null, hectares: number) => void
  setProfile: (profile: FarmProfile) => void
}

export const useFarmStore = create<FarmState>()((set) => ({
  polygon: null,
  hectares: 0,
  profile: null,
  setField: (polygon, hectares) => set({ polygon, hectares }),
  setProfile: (profile) => set({ profile }),
}))