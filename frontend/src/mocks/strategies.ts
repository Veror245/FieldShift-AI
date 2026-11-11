import type { Strategy } from "@/types/api"

// DEMO DATA ONLY. Placeholder scores, not real evaluation results.
export const mockStrategies: Strategy[] = [
  {
    id: "a",
    name: "Existing Rotation",
    kind: "baseline",
    sequence: [
      { season: "Kharif", crop: "Rice" },
      { season: "Rabi", crop: "Wheat" },
    ],
    scores: {
      waterEfficiency: 35, climateCompatibility: 50, soilImprovement: 30,
      nitrogenCycling: 20, erosionProtection: 40, cropDiversity: 20,
      economicPotential: 75, feasibility: 90,
    },
    overallScore: 45,
    benefits: ["Familiar to the farmer", "Equipment and labour already in place"],
    drawbacks: ["High water demand", "Low crop diversity"],
    risks: ["Water availability has become unreliable"],
    missingData: [],
    needsExpertValidation: false,
  },
  {
    id: "b",
    name: "Soil Restoration",
    kind: "soil",
    sequence: [
      { season: "Kharif", crop: "Soybean" },
      { season: "Rabi", crop: "Wheat" },
      { season: "Summer", crop: "Green manure" },
    ],
    scores: {
      waterEfficiency: 62, climateCompatibility: 64, soilImprovement: 86,
      nitrogenCycling: 84, erosionProtection: 74, cropDiversity: 70,
      economicPotential: 58, feasibility: 62,
    },
    overallScore: 71,
    benefits: ["Legumes can add nitrogen to the soil", "Summer cover protects bare soil"],
    drawbacks: ["Needs a market for soybean", "Extra labour for green manure"],
    risks: ["Soybean planting window may overlap with field preparation"],
    missingData: ["Local soybean market prices"],
    needsExpertValidation: true,
  },
  {
    id: "c",
    name: "Climate Resilience",
    kind: "climate",
    sequence: [
      { season: "Kharif", crop: "Millet" },
      { season: "Rabi", crop: "Chickpea" },
      { season: "Summer", crop: "Fallow" },
    ],
    scores: {
      waterEfficiency: 88, climateCompatibility: 85, soilImprovement: 66,
      nitrogenCycling: 60, erosionProtection: 60, cropDiversity: 66,
      economicPotential: 52, feasibility: 70,
    },
    overallScore: 73,
    benefits: ["Low water demand", "Tolerates heat and dry spells better"],
    drawbacks: ["Lower expected market value", "Fallow leaves soil bare in summer"],
    risks: ["Bare-field period increases erosion exposure"],
    missingData: ["Local millet market information", "Seed availability"],
    needsExpertValidation: true,
  },
  {
    id: "d",
    name: "Farmer-Prioritized",
    kind: "farmer",
    sequence: [
      { season: "Kharif", crop: "Groundnut" },
      { season: "Rabi", crop: "Mustard" },
    ],
    scores: {
      waterEfficiency: 76, climateCompatibility: 72, soilImprovement: 62,
      nitrogenCycling: 55, erosionProtection: 58, cropDiversity: 55,
      economicPotential: 70, feasibility: 80,
    },
    overallScore: 68,
    benefits: ["Balances water saving and cost", "Uses crops with established markets"],
    drawbacks: ["Smaller soil-building benefit"],
    risks: ["Pest and disease cycle for oilseed crops needs checking"],
    missingData: ["Input cost estimates"],
    needsExpertValidation: true,
  },
]