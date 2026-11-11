import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"
import type { Scores } from "@/types/api"
import { scoreMeta } from "@/lib/scoreLabels"

type Props = {
  scores: Scores
  baseline?: Scores
  color?: string
}

export default function RotationRadar({ scores, baseline, color = "#1E3A2F" }: Props) {
  const data = scoreMeta.map((m) => ({
    axis: m.short,
    value: scores[m.key],
    baseline: baseline ? baseline[m.key] : undefined,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#1E3A2F25" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "#1E3A2F" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {baseline && (
            <Radar
              dataKey="baseline"
              stroke="#8FA89B"
              strokeDasharray="4 4"
              strokeWidth={2}
              fill="none"
              isAnimationActive={false}
            />
          )}
          <Radar
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2.5}
            animationDuration={900}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}