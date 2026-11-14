export type BackendInvestigationResult = {
  investigation_id: string
  status: "complete" | "pending" | "running" | "failed"
  farm_id: string
  advisor: {
    overview: string
    strategy_explanations: Array<{
      strategy_id: string
      plain_summary: string
      why_suggested: string
      key_benefits: string[]
      key_drawbacks: string[]
      uncertainties: string[]
      farmer_questions: string[]
      sources: string[]
    }>
    comparison: string
    recommendation_note: string
    next_steps: string[]
    overall_uncertainties: string[]
  }
  rotation: {
    pareto_front?: string[]
    recommended_order?: string[]
    strategies: Array<{
      strategy_id: string
      label: string
      sequence: Array<{ crop_id: string; season: string; year: number }>
      scores: {
        water_efficiency: number
        climate_compatibility: number
        soil_improvement: number
        nitrogen_cycling: number
        erosion_protection: number
        crop_diversity: number
        economic_potential: number
        feasibility: number
      }
      weighted_score: number
      hard_constraint_status: string
      hard_constraint_reasons: string[]
      assumptions: string[]
      benefits: string[]
      drawbacks: string[]
      missing_data: string[]
      expert_validation_needed: string[]
    }>
  }
  agronomy: {
    soil_assessment: {
      ph?: { value: number; status: string }
      organic_carbon_pct?: { value: number; status: string }
    }
    crop_compatibility: unknown[]
    planting_window_conflicts: string[]
    expert_validation_needed: string[]
  }
  earth_obs: {
    source: string
    grid_resolution_deg: number
    temperature_c: number
    precipitation_mm: number
    missing_days: number
    start_date: string
    end_date: string
  }
  created_at: string
}
