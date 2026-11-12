import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { FieldPolygon } from "@/types/geojson"
import type { FarmProfile } from "@/types/farm"

type FarmState = {
  polygon: FieldPolygon | null
  hectares: number
  profile: FarmProfile | null
  selectedStrategyId: string | null
  setField: (polygon: FieldPolygon | null, hectares: number) => void
  setProfile: (profile: FarmProfile) => void
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
      setField: (polygon, hectares) => set({ polygon, hectares }),
      setProfile: (profile) => set({ profile }),
      selectStrategy: (id) => set({ selectedStrategyId: id }),
      resetFarm: () =>
        set({ polygon: null, hectares: 0, profile: null, selectedStrategyId: null }),
    }),
    { name: "fieldshift-farm" }
  )
)