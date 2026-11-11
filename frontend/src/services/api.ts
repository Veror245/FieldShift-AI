import type { ClimateFindings, Strategy } from "@/types/api"
import { mockStrategies } from "@/mocks/strategies"
import { mockClimate } from "@/mocks/climate"

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false"
export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function getStrategies(): Promise<Strategy[]> {
  if (USE_MOCK) {
    await wait(800)
    return mockStrategies
  }
  const res = await fetch(`${BASE_URL}/rotations/compare`, { method: "POST" })
  if (!res.ok) throw new Error("Failed to load strategies")
  return res.json()
}

export async function getClimateFindings(): Promise<ClimateFindings> {
  if (USE_MOCK) {
    await wait(700)
    return mockClimate
  }
  const res = await fetch(`${BASE_URL}/climate/findings`)
  if (!res.ok) throw new Error("Failed to load climate findings")
  return res.json()
}
