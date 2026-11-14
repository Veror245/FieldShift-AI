export type BackendSeasonCluster = {
  cluster_id: number
  label: string
  size: number
  centroid: {
    avg_temperature: number
    total_rainfall: number
    rainfall_std: number
    avg_solar_radiation: number
    avg_humidity: number
    avg_wind_speed: number
    rainy_day_ratio: number
  }
  features: string[]
}

export type BackendCurrentSeason = {
  year: number
  cluster_id: number
  label: string
  distance_to_centroid: number
}

export type BackendClimateAnomaly = {
  date_range: string
  score: number
  features: {
    avg_temperature: number
    total_rainfall: number
    rainfall_std: number
    avg_solar_radiation: number
    avg_humidity: number
    avg_wind_speed: number
    rainy_day_ratio: number
  }
}

export type BackendBaselineComparison = {
  recent_precip_mm: number
  historical_avg_mm: number
  deviation_pct: number
}

export type BackendClimateData = {
  season_clusters: BackendSeasonCluster[]
  current_season: BackendCurrentSeason
  anomalies: BackendClimateAnomaly[]
  baseline_comparison: BackendBaselineComparison
  crop_stress_level?: string | null
}

export type BackendEarthObs = {
  source: string
  grid_resolution_deg: number
  fetched_at?: string
  missing_days?: number
  start_date: string
  end_date: string
  n_days?: number
  temperature_c: number
  humidity_pct?: number
  wind_speed_ms?: number
  precipitation_mm: number
  solar_radiation_mj?: number
}

export type BackendInvestigationResult = {
  investigation_id: string
  status?: "complete" | "pending" | "running" | "failed"
  farm_id?: string
  advisor?: {
    overview?: string | null
    strategy_explanations?: Array<{
      strategy_id: string
      plain_summary: string
      why_suggested: string
      key_benefits: string[]
      key_drawbacks: string[]
      uncertainties: string[]
      farmer_questions: string[]
      sources: string[]
    }>
    comparison?: string | null
    recommendation_note?: string | null
    next_steps?: string[] | null
    overall_uncertainties?: string[]
  } | null
  rotation?: {
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
  } | null
  agronomy?: {
    soil_assessment: {
      ph?: { value: number; status: string } | null
      organic_carbon_pct?: { value: number; status: string } | null
    }
    crop_compatibility?: unknown[]
    planting_window_conflicts?: string[]
    expert_validation_needed?: string[]
  } | null
  earth_obs?: BackendEarthObs | null
  climate?: BackendClimateData | null
  created_at?: string
}
