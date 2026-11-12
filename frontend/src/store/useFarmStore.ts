import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { FieldPolygon } from "@/types/geojson"
import type { FarmProfile } from "@/types/farm"

type FarmState = {
  polygon: FieldPolygon | null
  hectares: number
  profile: FarmProfile | null
  selectedStrategyId: string | null
  locationAddress: string | null
  setField: (polygon: FieldPolygon | null, hectares: number, locationAddress?: string | null) => void
  setProfile: (profile: FarmProfile) => void
  setLocationAddress: (locationAddress: string | null) => void
  selectStrategy: (id: string | null) => void
  resetFarm: () => void
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set) => ({
      polygon: null,
      hectares: 0,
      profile: null,
      selectedStrategyId: null,
      locationAddress: null,
      setField: (polygon, hectares, locationAddress) =>
        set((state) => ({
          polygon,
          hectares,
          locationAddress: locationAddress !== undefined ? locationAddress : state.locationAddress,
        })),
      setProfile: (profile) => set({ profile }),
      setLocationAddress: (locationAddress) => set({ locationAddress }),
      selectStrategy: (id) => set({ selectedStrategyId: id }),
      resetFarm: () =>
        set({ polygon: null, hectares: 0, profile: null, selectedStrategyId: null, locationAddress: null }),
    }),
    { name: "fieldshift-farm" }
  )
)
