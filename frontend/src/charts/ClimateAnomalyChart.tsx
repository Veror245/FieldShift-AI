import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ClimateSeason } from "@/types/api"

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ClimateSeason }[]
}) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div className="rounded-xl bg-forest p-3 text-xs text-ivory shadow-xl">
      <p className="mb-1 text-sm font-semibold">{s.year}</p>
      <p>Rainfall: {s.rainfallMm} mm</p>
      <p>Mean temperature: {s.meanTempC} °C</p>
      <p>Longest dry spell: {s.longestDrySpellDays} days</p>
      <p className={s.isAnomaly ? "mt-1 font-semibold text-sun" : "mt-1 text-sage"}>
        {s.isAnomaly ? "Unusual season" : "Within normal range"} (score {s.anomalyScore.toFixed(2)})
      </p>
    </div>
  )
}

export default function ClimateAnomalyChart({ seasons }: { seasons: ClimateSeason[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={seasons} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A2F20" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="rain"
            tick={{ fontSize: 11 }}
            label={{ value: "Rainfall (mm)", angle: -90, position: "insideLeft", fontSize: 11, dx: 14 }}
          />
          <YAxis
            yAxisId="temp"
            orientation="right"
            domain={[27, 30.5]}
            tick={{ fontSize: 11 }}
            label={{ value: "Temp (°C)", angle: 90, position: "insideRight", fontSize: 11, dx: -10 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#1E3A2F10" }} />
          <Bar yAxisId="rain" dataKey="rainfallMm" radius={[6, 6, 0, 0]} animationDuration={900}>
            {seasons.map((s) => (
              <Cell key={s.year} fill={s.isAnomaly ? "#E08E45" : "#8FA89B"} />
            ))}
          </Bar>
          <Line
            yAxisId="temp"
            dataKey="meanTempC"
            stroke="#1E3A2F"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#1E3A2F" }}
            animationDuration={1200}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}