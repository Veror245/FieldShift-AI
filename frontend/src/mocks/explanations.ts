import type { EvidenceRecord, StrategyExplanation } from "@/types/api"
const evidence: EvidenceRecord[] = [
  {
    id: "E1",
    kind: "observation",
    title: "Daily rainfall and temperature records",
    dataset: "NASA POWER (demo placeholder)",
    date: "2006 to 2025",
    resolution: "About 50 km grid, daily",
    note: "Describes the wider area, not the exact field.",
  },
  {
    id: "E2",
    kind: "derived",
    title: "Seasonal rainfall anomaly and dry-spell length",
    dataset: "Calculated from NASA POWER",
    date: "2006 to 2025",
    resolution: "One value per season, regional grid",
  },
  {
    id: "E3",
    kind: "ml",
    title: "Season type grouping (KMeans)",
    dataset: "Climate Intelligence Agent",
    date: "Run during this investigation",
    resolution: "One value per season",
    note: "Group names are assigned after inspecting each group.",
  },
  {
    id: "E4",
    kind: "ml",
    title: "Unusual-season detection (Isolation Forest)",
    dataset: "Climate Intelligence Agent",
    date: "Run during this investigation",
    resolution: "One score per season",
    note: "An unusual season does not prove a crop failed.",
  },
  {
    id: "E5",
    kind: "farmer",
    title: "Soil inputs and current rotation",
    dataset: "Entered by the farmer",
    date: "Entered in this session",
    resolution: "Field level, not lab-verified in the app",
    note: "Blank values are treated as unknown, never guessed.",
  },
  {
    id: "E6",
    kind: "agronomy",
    title: "Crop water needs, nitrogen fixing and plant-family groups",
    dataset: "Curated crop knowledge base",
    date: "Not dated",
    resolution: "Regional, needs local verification",
  },
  {
    id: "E7",
    kind: "agronomy",
    title: "Rotation rule checks",
    dataset: "Deterministic validation rules",
    date: "Run during this investigation",
    resolution: "Per candidate rotation",
  },
  {
    id: "E8",
    kind: "llm",
    title: "Plain-language wording of this explanation",
    dataset: "Farmer Advisor Agent",
    date: "Generated in this session",
    resolution: "Not an observation",
    note: "Wording only. Facts come from the records above.",
  },
]
const limitations = [
  "Climate data comes from a coarse grid and describes the wider area, not your exact field.",
  "Soil values are limited to what you entered. Gridded soil maps are less precise than a lab test.",
  "Crop information is regional and incomplete. Items marked unknown are not guessed.",
  "Scores compare these options with each other. They do not predict yield or income.",
]
export const mockExplanations: Record<string, StrategyExplanation> = {
  a: {
    strategyId: "a",
    why: {
      text: "This is your current rotation. It is shown as the baseline so every alternative can be compared against it.",
      evidenceIds: ["E5"],
    },
    observations: {
      text: "Seasonal rainfall in recent years has been below the long-term average, and several recent seasons were flagged as unusual.",
      evidenceIds: ["E1", "E2", "E4"],
    },
    soil: {
      text: "The soil values you entered were used. Anything left blank was treated as unknown.",
      evidenceIds: ["E5"],
    },
    crops: {
      text: "Both crops need a lot of water and come from the same plant-family group, which limits nitrogen and diversity benefits.",
      evidenceIds: ["E6"],
    },
    confidence: {
      completeness: "medium",
      recency: "medium",
      resolution: "low",
      note: "Good climate history, but only coarse-resolution data and limited soil detail.",
    },
    limitations,
    evidence,
  },
  b: {
    strategyId: "b",
    why: {
      text: "Generated to improve soil health. It adds a legume and a ground-covering crop so the soil is protected for more of the year.",
      evidenceIds: ["E5", "E6"],
    },
    observations: {
      text: "Recent seasons were drier and warmer than usual, so crops with moderate water needs were preferred over the heaviest water users.",
      evidenceIds: ["E1", "E2", "E3"],
    },
    soil: {
      text: "Low organic matter and the soil texture you entered raised the value of legumes and residue-adding crops.",
      evidenceIds: ["E5"],
    },
    crops: {
      text: "The legume can add nitrogen, deeper roots improve soil structure, and mixing plant families reduces repeated pest and disease pressure.",
      evidenceIds: ["E6"],
    },
    confidence: {
      completeness: "medium",
      recency: "medium",
      resolution: "low",
      note: "Market information is missing, so economic scores are the least certain.",
    },
    limitations,
    evidence,
  },
  c: {
    strategyId: "c",
    why: {
      text: "Generated to cope better with hot and dry conditions by using crops with lower water demand and better heat tolerance.",
      evidenceIds: ["E2", "E3", "E6"],
    },
    observations: {
      text: "Hot and dry seasons have become more frequent in the history, and the current season resembles several of them.",
      evidenceIds: ["E1", "E2", "E3", "E4"],
    },
    soil: {
      text: "The soil values you entered were checked for compatibility with these crops. Missing values were kept as unknown.",
      evidenceIds: ["E5"],
    },
    crops: {
      text: "Low water needs and heat tolerance raised its ranking. A bare summer period lowered erosion protection.",
      evidenceIds: ["E6", "E7"],
    },
    confidence: {
      completeness: "medium",
      recency: "medium",
      resolution: "low",
      note: "Seed availability and local market information are missing.",
    },
    limitations,
    evidence,
  },
  d: {
    strategyId: "d",
    why: {
      text: "Generated from your own priorities: saving water while keeping costs reasonable and using crops with established markets.",
      evidenceIds: ["E5"],
    },
    observations: {
      text: "Below-average rainfall in recent seasons supported a lower-water option, balanced against feasibility for your farm.",
      evidenceIds: ["E1", "E2"],
    },
    soil: {
      text: "Soil inputs were checked, but soil improvement carried less weight than your water and cost priorities.",
      evidenceIds: ["E5"],
    },
    crops: {
      text: "Moderate water needs and workable planting windows raised its ranking. The plant-family mix gives a smaller soil-building benefit.",
      evidenceIds: ["E6", "E7"],
    },
    confidence: {
      completeness: "medium",
      recency: "medium",
      resolution: "low",
      note: "Input cost estimates are missing, so cost scores are uncertain.",
    },
    limitations,
    evidence,
  },
}
