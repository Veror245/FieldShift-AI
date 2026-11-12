import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { FieldPolygon } from "@/types/geojson"
import type { FarmProfile } from "@/types/farm"
import { defaultWeights, type Weights } from "@/lib/scoring"

type FarmState = {
  polygon: FieldPolygon | null
  hectares: number
  profile: FarmProfile | null
  selectedStrategyId: string | null
  weights: Weights
  setField: (polygon: FieldPolygon | null, hectares: number) => void
  setProfile: (profile: FarmProfile) => void
  selectStrategy: (id: string | null) => void
  setWeights: (weights: Weights) => void
  resetFarm: () => void
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set) => ({
      polygon: null,
      hectares: 0,
      profile: null,
      selectedStrategyId: null,
      weights: defaultWeights,
      setField: (polygon, hectares) => set({ polygon, hectares }),
      setProfile: (profile) => set({ profile }),
      selectStrategy: (id) => set({ selectedStrategyId: id }),
      setWeights: (weights) => set({ weights }),
      resetFarm: () =>
        set({
          polygon: null,
          hectares: 0,
          profile: null,
          selectedStrategyId: null,
          weights: defaultWeights,
        }),
    }),
    { name: "fieldshift-farm" }
  )
)