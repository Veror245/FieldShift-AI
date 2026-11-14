import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { FieldPolygon } from "@/types/geojson"
import type { FarmProfile } from "@/types/farm"
import type { BackendInvestigationResult } from "@/types/investigation"
import { defaultWeights, type Weights } from "@/lib/scoring"
import { sampleBackendInvestigationResult } from "@/mocks/mockInvestigationResult"

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
      })

type FarmState = {
  farmId: string | null
  investigationId: string | null
  investigationResult: BackendInvestigationResult | null
  polygon: FieldPolygon | null
  hectares: number
  profile: FarmProfile | null
  selectedStrategyId: string | null
  weights: Weights
  investigationResult: BackendInvestigationResult | null
  ensureFarmId: () => string
  setInvestigationId: (id: string | null) => void
  setInvestigationResult: (result: BackendInvestigationResult | null) => void
  setField: (polygon: FieldPolygon | null, hectares: number) => void
  setProfile: (profile: FarmProfile) => void
  selectStrategy: (id: string | null) => void
  setWeights: (weights: Weights) => void
  setInvestigationResult: (res: BackendInvestigationResult | null) => void
  resetFarm: () => void
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      farmId: null,
      investigationId: null,
      investigationResult: null,
      polygon: null,
      hectares: 0,
      profile: null,
      selectedStrategyId: null,
      weights: defaultWeights,
      investigationResult: sampleBackendInvestigationResult,
      ensureFarmId: () => {
        const existing = get().farmId
        if (existing) return existing
        const id = newId()
        set({ farmId: id })
        return id
      },
      setInvestigationId: (id) => set({ investigationId: id }),
      setInvestigationResult: (result) => set({ investigationResult: result }),
      setField: (polygon, hectares) => set({ polygon, hectares }),
      setProfile: (profile) => set({ profile }),
      selectStrategy: (id) => set({ selectedStrategyId: id }),
      setWeights: (weights) => set({ weights }),
      setInvestigationResult: (res) => set({ investigationResult: res }),
      resetFarm: () =>
        set({
          farmId: null,
          investigationId: null,
          investigationResult: null,
          polygon: null,
          hectares: 0,
          profile: null,
          selectedStrategyId: null,
          weights: defaultWeights,
          investigationResult: sampleBackendInvestigationResult,
        }),
    }),
    { name: "fieldshift-farm-v2" }
  )
)
