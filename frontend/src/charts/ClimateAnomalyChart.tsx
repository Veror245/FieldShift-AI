import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
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
    <div className="bg-[rgba(34,32,28,0.92)] rounded-2xl border border-[rgba(230,224,210,0.22)] p-4 text-xs text-[#F4F0E6] shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10">
        <span className="text-base font-bold text-[#F4F0E6]">{s.year} Season</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
            s.isAnomaly
              ? "bg-[#A66843]/25 text-[#E5A882] border border-[#A66843]/50"
              : "bg-[#4E633D]/25 text-[#98B882] border border-[#4E633D]/50"
          }`}
        >
          {s.isAnomaly ? "Unusual" : "Normal"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[#C8C3B4]">
        <div>
          <span className="text-[10px] text-[#A8A396] block">Rainfall</span>
          <span className="text-sm font-semibold text-[#F4F0E6]">{s.rainfallMm} mm</span>
        </div>
        <div>
          <span className="text-[10px] text-[#A8A396] block">Mean Temp</span>
          <span className="text-sm font-semibold text-[#F4F0E6]">{s.meanTempC}°C</span>
        </div>
        <div>
          <span className="text-[10px] text-[#A8A396] block">Dry Spell</span>
          <span className="text-sm font-semibold text-[#F4F0E6]">{s.longestDrySpellDays} days</span>
        </div>
        <div>
          <span className="text-[10px] text-[#A8A396] block">Anomaly Score</span>
          <span className="text-sm font-semibold text-[#F4F0E6]">{s.anomalyScore.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default function ClimateAnomalyChart({ seasons }: { seasons: ClimateSeason[] }) {
  const rainfallValues = seasons.map((s) => s.rainfallMm)
  const longTermAvg = rainfallValues.reduce((a, b) => a + b, 0) / (rainfallValues.length || 1)

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={seasons} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="normalRainBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4E633D" stopOpacity={0.92} />
              <stop offset="100%" stopColor="#354528" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="anomalyRainBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A66843" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#7E4A2A" stopOpacity={0.75} />
            </linearGradient>
            <linearGradient id="tempGlowArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7E9167" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#7E9167" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(196, 179, 147, 0.35)" vertical={false} />

          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#5C5A52", fontWeight: 500 }}
          />

          <YAxis
            yAxisId="rain"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#7E7A6E" }}
            tickFormatter={(v) => `${v}`}
            label={{
              value: "Rainfall (mm)",
              angle: -90,
              position: "insideLeft",
              offset: 24,
              style: { fontSize: 10, fill: "#7E7A6E" },
            }}
          />

          <YAxis
            yAxisId="temp"
            orientation="right"
            axisLine={false}
            tickLine={false}
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tick={{ fontSize: 10, fill: "#7E7A6E" }}
            tickFormatter={(v) => `${v.toFixed(1)}°`}
            label={{
              value: "Mean temp (°C)",
              angle: 90,
              position: "insideRight",
              offset: 8,
              style: { fontSize: 10, fill: "#7E7A6E" },
            }}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(196, 179, 147, 0.15)", radius: 6 }}
          />

          {/* long-term average reference line, computed from the data itself */}
          <ReferenceLine
            yAxisId="rain"
            y={Math.round(longTermAvg)}
            stroke="#5C5A52"
            strokeDasharray="6 4"
            label={{
              value: `${Math.round(longTermAvg)} mm avg`,
              position: "insideTopLeft",
              fontSize: 10,
              fill: "#5C5A52",
            }}
          />

          <Bar
            yAxisId="rain"
            dataKey="rainfallMm"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            animationBegin={150}
            animationDuration={850}
            animationEasing="ease-out"
          >
            {seasons.map((s) => (
              <Cell
                key={s.year}
                fill={s.isAnomaly ? "url(#anomalyRainBar)" : "url(#normalRainBar)"}
              />
            ))}
          </Bar>

          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="meanTempC"
            fill="url(#tempGlowArea)"
            stroke="none"
          />

          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="meanTempC"
            stroke="#1E241B"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "#4E633D", stroke: "#E6E0D2", strokeWidth: 2 }}
            activeDot={{ r: 6.5, fill: "#A66843", stroke: "#FFFFFF", strokeWidth: 2.5 }}
            animationBegin={250}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
