import type { BackendInvestigationResult } from "@/types/investigation"

export const sampleBackendInvestigationResult: BackendInvestigationResult = {
  investigation_id: "inv-c2da399b",
  status: "complete",
  farm_id: "farm-001",
  advisor: {
    overview:
      "This investigation evaluates three crop rotation strategies to address unreliable water availability and low soil organic carbon (0.45%) while managing economic risk. The analysis compares the current rice-wheat cycle against alternatives focusing on soil restoration and climate resilience.",
    strategy_explanations: [
      {
        strategy_id: "strategy_a",
        plain_summary: "This is your current rotation of rice followed by wheat.",
        why_suggested:
          "This serves as the baseline for comparison to see how other options improve upon your current practices.",
        key_benefits: [
          "Higher erosion protection score (0.77) compared to alternatives",
        ],
        key_drawbacks: [
          "Fails hard constraints due to a planting conflict where rice harvest in month 11 overlaps wheat planting in month 10",
          "Low water efficiency (0.38)",
          "No nitrogen cycling (0.00)",
        ],
        uncertainties: [
          "Actual impact of the planting overlap on your specific yield is not quantified",
        ],
        farmer_questions: [
          "How have you historically managed the overlap between rice harvest and wheat planting?",
        ],
        sources: ["farmer_inputs", "scoring"],
      },
      {
        strategy_id: "strategy_b",
        plain_summary: "A rotation of mung bean followed by mustard.",
        why_suggested:
          "This strategy focuses on building soil health and maximizing water efficiency to meet your primary goals.",
        key_benefits: [
          "Very high water efficiency (0.94)",
          "Strong feasibility (1.00)",
          "Improved nitrogen cycling (0.50) compared to the baseline",
        ],
        key_drawbacks: ["Low economic potential score (0.12)"],
        uncertainties: [
          "Specific market prices for mung bean and mustard in your local area are not included",
        ],
        farmer_questions: [
          "What is the local market demand for mung bean and mustard compared to rice and wheat?",
        ],
        sources: ["scoring", "crop_kb"],
      },
      {
        strategy_id: "strategy_c",
        plain_summary: "A rotation of cowpea followed by mustard.",
        why_suggested:
          "This strategy is designed to handle hotter and drier conditions while maintaining high water efficiency.",
        key_benefits: [
          "Very high water efficiency (0.94)",
          "Maximum feasibility (1.00)",
          "Better erosion protection (0.61) than the mung bean rotation",
        ],
        key_drawbacks: ["Very low economic potential score (0.11)"],
        uncertainties: [
          "The specific drought-tolerance threshold of cowpea in your local micro-climate is unverified",
        ],
        farmer_questions: [
          "Are cowpea and mustard compatible with your existing machinery and labor availability?",
        ],
        sources: ["scoring", "crop_kb"],
      },
    ],
    comparison:
      "Strategies B and C are very similar, both offering high water efficiency (0.94) and feasibility (1.00) while solving the planting conflict found in Strategy A. Strategy C provides a slight advantage in erosion protection (0.61 vs 0.59), while both have significantly lower economic potential (0.11-0.12) compared to the baseline relative score.",
    recommendation_note:
      "You may want to weigh the trade-off between your high priority for water efficiency (0.90) and soil improvement (0.80) against the lower economic potential of the mung bean or cowpea rotations. If erosion protection is a secondary concern, Strategy C offers a marginal benefit over Strategy B.",
    next_steps: [
      "Consult a local expert to verify the marketability of cowpea and mung bean in your region.",
      "Verify if the soil pH of 7.8 (slightly alkaline) requires specific variety selection for mustard.",
      "Review your water budget to see if the 0.94 efficiency score aligns with your actual available water.",
    ],
    overall_uncertainties: [
      "NASA POWER climate data is coarse (0.5 degree resolution) and may not reflect field-level precision.",
      "ML climate analysis is not yet available; only raw averages were used.",
      "Economic potential is a relative score and not a guaranteed revenue figure.",
    ],
  },
  rotation: {
    pareto_front: ["strategy_b", "strategy_c"],
    recommended_order: ["strategy_c", "strategy_b"],
    strategies: [
      {
        strategy_id: "strategy_a",
        label: "existing",
        sequence: [
          { crop_id: "rice", season: "kharif", year: 2024 },
          { crop_id: "wheat", season: "rabi", year: 2024 },
          { crop_id: "rice", season: "kharif", year: 2025 },
          { crop_id: "wheat", season: "rabi", year: 2025 },
        ],
        scores: {
          water_efficiency: 0.38,
          climate_compatibility: 0.5,
          soil_improvement: 0.53,
          nitrogen_cycling: 0.0,
          erosion_protection: 0.77,
          crop_diversity: 0.25,
          economic_potential: 0.41,
          feasibility: 0.25,
        },
        weighted_score: 0.3788,
        hard_constraint_status: "fail",
        hard_constraint_reasons: [
          "planting conflict: rice harvest (month 11) overlaps wheat planting (month 10)",
        ],
        assumptions: [],
        benefits: ["Higher erosion protection score (0.77)"],
        drawbacks: [
          "Planting schedule conflict between rice and wheat",
          "Low water efficiency",
        ],
        missing_data: [],
        expert_validation_needed: [
          "Harvest overlap mitigation before planting",
        ],
      },
      {
        strategy_id: "strategy_b",
        label: "soil_and_water",
        sequence: [
          { crop_id: "mung_bean", season: "kharif", year: 2024 },
          { crop_id: "mustard", season: "rabi", year: 2024 },
          { crop_id: "mung_bean", season: "kharif", year: 2025 },
          { crop_id: "mustard", season: "rabi", year: 2025 },
        ],
        scores: {
          water_efficiency: 0.94,
          climate_compatibility: 0.58,
          soil_improvement: 0.76,
          nitrogen_cycling: 0.5,
          erosion_protection: 0.59,
          crop_diversity: 0.5,
          economic_potential: 0.12,
          feasibility: 1.0,
        },
        weighted_score: 0.7104,
        hard_constraint_status: "pass",
        hard_constraint_reasons: [],
        assumptions: [],
        benefits: [
          "High water efficiency (0.94)",
          "Enhanced nitrogen cycling through pulses",
          "Optimal feasibility rating",
        ],
        drawbacks: ["Lower economic cash return compared to cereal rotations"],
        missing_data: [],
        expert_validation_needed: ["Local market demand verification"],
      },
      {
        strategy_id: "strategy_c",
        label: "climate_resilient",
        sequence: [
          { crop_id: "cowpea", season: "kharif", year: 2024 },
          { crop_id: "mustard", season: "rabi", year: 2024 },
          { crop_id: "cowpea", season: "kharif", year: 2025 },
          { crop_id: "mustard", season: "rabi", year: 2025 },
        ],
        scores: {
          water_efficiency: 0.94,
          climate_compatibility: 0.62,
          soil_improvement: 0.74,
          nitrogen_cycling: 0.5,
          erosion_protection: 0.61,
          crop_diversity: 0.5,
          economic_potential: 0.11,
          feasibility: 1.0,
        },
        weighted_score: 0.7188,
        hard_constraint_status: "pass",
        hard_constraint_reasons: [],
        assumptions: [],
        benefits: [
          "High water efficiency (0.94)",
          "Superior heat and drought tolerance with cowpea",
          "Balanced ground erosion protection (0.61)",
        ],
        drawbacks: ["Lower relative cash return"],
        missing_data: [],
        expert_validation_needed: [
          "Seed availability for cowpea local variety",
        ],
      },
    ],
  },
  agronomy: {
    soil_assessment: {
      ph: { value: 7.8, status: "slightly_alkaline" },
      organic_carbon_pct: { value: 0.45, status: "low" },
    },
    crop_compatibility: [
      { crop: "rice", compatible: true },
      { crop: "wheat", compatible: true },
      { crop: "mung_bean", compatible: true },
      { crop: "mustard", compatible: true },
      { crop: "cowpea", compatible: true },
    ],
    planting_window_conflicts: [
      "rice harvest (month 11) overlaps wheat planting (month 10)",
    ],
    expert_validation_needed: [
      "Confirm alkaline tolerance of chosen mustard cultivars",
    ],
  },
  earth_obs: {
    source: "NASA_POWER",
    grid_resolution_deg: 0.5,
    fetched_at: "2026-11-14T21:05:16.969613Z",
    missing_days: 0,
    start_date: "1995-01-01",
    end_date: "2025-12-31",
    n_days: 11323,
    temperature_c: 25.24881745120551,
    humidity_pct: 44.013472577938714,
    wind_speed_ms: 1.6343416055815598,
    precipitation_mm: 21526.05,
    solar_radiation_mj: 18.118830698578115,
  },
  climate: {
    season_clusters: [
      {
        cluster_id: 0,
        label: "Zaid-like",
        size: 31,
        centroid: {
          avg_temperature: 30.050662692847126,
          total_rainfall: 227.711935483871,
          rainfall_std: 5.719866676927074,
          avg_solar_radiation: 20.45029102384292,
          avg_humidity: 60.386595371669,
          avg_wind_speed: 2.610248948106592,
          rainy_day_ratio: 0.6307854137447405,
        },
        features: [
          "avg_temperature",
          "total_rainfall",
          "rainfall_std",
          "avg_solar_radiation",
          "avg_humidity",
          "avg_wind_speed",
          "rainy_day_ratio",
        ],
      },
      {
        cluster_id: 1,
        label: "Rabi-like",
        size: 30,
        centroid: {
          avg_temperature: 19.744203076216714,
          total_rainfall: 69.8943333333333,
          rainfall_std: 2.882100442810037,
          avg_solar_radiation: 14.479505417814508,
          avg_humidity: 68.83894552341597,
          avg_wind_speed: 1.593483103764922,
          rainy_day_ratio: 0.1828030303030304,
        },
        features: [
          "avg_temperature",
          "total_rainfall",
          "rainfall_std",
          "avg_solar_radiation",
          "avg_humidity",
          "avg_wind_speed",
          "rainy_day_ratio",
        ],
      },
      {
        cluster_id: 2,
        label: "Kharif-like",
        size: 31,
        centroid: {
          avg_temperature: 28.113305924520347,
          total_rainfall: 1289.7167741935486,
          rainfall_std: 11.402649913533661,
          avg_solar_radiation: 15.508007590132827,
          avg_humidity: 85.93786843769766,
          avg_wind_speed: 2.435660974067046,
          rainy_day_ratio: 0.923044486611849,
        },
        features: [
          "avg_temperature",
          "total_rainfall",
          "rainfall_std",
          "avg_solar_radiation",
          "avg_humidity",
          "avg_wind_speed",
          "rainy_day_ratio",
        ],
      },
    ],
    current_season: {
      year: 2025,
      cluster_id: 2,
      label: "Kharif-like",
      distance_to_centroid: 2.2805857175121935,
    },
    anomalies: [
      {
        date_range: "Kharif 2025",
        score: 0.626795297236734,
        features: {
          avg_temperature: 28.84352941176471,
          total_rainfall: 1051.94,
          rainfall_std: 9.43716686319855,
          avg_solar_radiation: 17.52300653594771,
          avg_humidity: 72.388954248366,
          avg_wind_speed: 1.680326797385621,
          rainy_day_ratio: 0.7777777777777778,
        },
      },
    ],
    baseline_comparison: {
      recent_precip_mm: 1051.94,
      historical_avg_mm: 1284.22,
      deviation_pct: -18.087243618694615,
    },
    crop_stress_level: null,
  },
  created_at: "2026-11-14T21:05:21.413290Z",
}
