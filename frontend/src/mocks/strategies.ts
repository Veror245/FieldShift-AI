import type { Strategy } from "@/types/api"

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
    benefits: ["Familiar to the farmer", "Equipment already available"],
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
      { season: "Kharif", crop: "Chickpea" },
      { season: "Rabi", crop: "Sorghum" },
      { season: "Summer", crop: "Mustard" },
    ],
    scores: {
      waterEfficiency: 70, climateCompatibility: 68, soilImprovement: 85,
      nitrogenCycling: 80, erosionProtection: 72, cropDiversity: 78,
      economicPotential: 55, feasibility: 60,
    },
    overallScore: 71,
    benefits: ["Legumes add nitrogen", "Better ground cover"],
    drawbacks: ["Needs new market links", "Extra labour"],
    risks: ["Planting window overlap"],
    missingData: ["Local market prices"],
    needsExpertValidation: true,
  },
]