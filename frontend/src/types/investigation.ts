/** Shape of the full investigation result returned by the backend after agents finish. */
export type BackendInvestigationResult = {
  investigation_id: string

  earth_obs?: {
    start_date: string
    end_date: string
    precipitation_mm: number
    temperature_c: number
    source: string
    grid_resolution_deg: number
  } | null

  agronomy?: {
    soil_assessment: {
      ph?: { value: number; status: string } | null
      organic_carbon_pct?: { value: number; status: string } | null
    }
    planting_window_conflicts: string[]
  } | null

  advisor?: {
    overview?: string | null
    comparison?: string | null
    recommendation_note?: string | null
    next_steps?: string[] | null
  } | null
}
