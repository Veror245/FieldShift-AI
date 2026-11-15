import type { ReactNode } from "react"
import { scoreMeta } from "@/lib/scoreLabels"
import type { Weights } from "@/lib/scoring"
import type { FarmProfile, Priorities } from "@/types/farm"
import { defaultPriorities, priorityLabels } from "@/types/farm"
import type { ClimateFindings, EvidenceKind, Strategy, StrategyExplanation } from "@/types/api"
import type { FieldPolygon } from "@/types/geojson"
import type { GeocodedAddress } from "@/utils/reverseGeocode"
import { formatCoordinates } from "@/utils/reverseGeocode"
import type { BackendInvestigationResult } from "@/types/investigation"

const waterLabel: Record<FarmProfile["water"], string> = {
  reliable: "Reliable irrigation all season",
  unreliable: "Irrigation, but unreliable",
  rainfed: "Rain-fed only",
}

const textureLabel: Record<FarmProfile["soilTexture"], string> = {
  unknown: "Unknown (not provided)",
  sandy: "Sandy",
  loamy: "Loamy",
  clay: "Clay",
  silty: "Silty",
}

const kindLabel: Record<EvidenceKind, string> = {
  observation: "Direct observation",
  derived: "Derived indicator",
  ml: "ML-discovered pattern",
  agronomy: "Agronomic knowledge",
  farmer: "Farmer-provided",
  llm: "AI-written wording",
}

/** Distinct fill per strategy kind, matching the app's Rotation Studio colors. */
const kindColor: Record<Strategy["kind"], string> = {
  baseline: "#5F7A6B",
  soil: "#1E3A2F",
  climate: "#2F6B57",
  farmer: "#E08E45",
}

/**
 * Professional report primitives.
 * - Section: small-caps eyebrow + bold title, thin rule, no "1." numbering.
 * - Row: label / value with hairline separators; `star` renders a
 *   verification asterisk after the value (see legend under the header).
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7 break-inside-avoid">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-base font-bold text-forest">{title}</h2>
        <div className="h-px flex-1 bg-forest/15" />
      </div>
      {children}
    </section>
  )
}

function Row({ label, value, star }: { label: string; value: ReactNode; star?: boolean }) {
  return (
    <div className="flex gap-3 border-b border-forest/8 py-1.5 text-sm">
      <dt className="w-44 shrink-0 text-forest/60">{label}</dt>
      <dd className="font-medium text-forest">
        {value}
        {star && <span className="ml-1 font-bold text-sun">*</span>}
      </dd>
    </div>
  )
}

function ScoreBar({ value, color = "#4E633D" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-forest/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-7 text-right font-mono text-xs font-bold text-forest">{value}</span>
    </div>
  )
}

function FieldBoundarySvg({ polygon }: { polygon: FieldPolygon | null }) {
  const width = 240
  const height = 160
  const pad = 18

  if (!polygon || !polygon.geometry || !polygon.geometry.coordinates[0]?.length) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-forest/20 bg-forest/5 p-4 text-center text-xs text-forest/60">
        GPS Point Location (No boundary drawn)
      </div>
    )
  }

  const ring = polygon.geometry.coordinates[0] as [number, number][]
  const midLat = ring.reduce((a, p) => a + p[1], 0) / ring.length
  const k = Math.cos((midLat * Math.PI) / 180)
  const pts = ring.map((p) => ({ x: p[0] * k, y: -p[1] }))

  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const w = Math.max(...xs) - minX || 1e-9
  const h = Math.max(...ys) - minY || 1e-9
  const scale = Math.min((width - pad * 2) / w, (height - pad * 2) / h)
  const offX = (width - w * scale) / 2
  const offY = (height - h * scale) / 2

  const points = pts
    .map(
      (p) => `${((p.x - minX) * scale + offX).toFixed(1)},${((p.y - minY) * scale + offY).toFixed(1)}`
    )
    .join(" ")

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-hidden rounded-xl border border-forest/15 bg-[#F4F1E8] shadow-inner"
    >
      <defs>
        <pattern id="rptGrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#E3DECF" strokeWidth="0.75" />
        </pattern>
        <linearGradient id="rptFieldFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A2F" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2F6B57" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill="#F4F1E8" />
      <rect width={width} height={height} fill="url(#rptGrid)" />
      <polygon
        points={points}
        fill="url(#rptFieldFill)"
        stroke="#E08E45"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {pts.slice(0, -1).map((p, i) => {
        const cx = ((p.x - minX) * scale + offX).toFixed(1)
        const cy = ((p.y - minY) * scale + offY).toFixed(1)
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="6.5" fill="#FFFFFF" stroke="#1E241B" strokeWidth="1" />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7.5"
              fontWeight="700"
              fill="#1E241B"
            >
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

type Props = {
  profile: FarmProfile | null
  hectares: number
  corners: number
  polygon?: FieldPolygon | null
  coordinates?: { lat: number; lng: number } | null
  address?: GeocodedAddress | null
  strategies: Strategy[]
  selected: Strategy
  climate: ClimateFindings
  explanation: StrategyExplanation
  weights: Weights
  priorities?: Priorities | null
  investigationResult?: BackendInvestigationResult | null
  isDemo: boolean
}

export default function ReportDocument({
  profile,
  hectares,
  corners,
  polygon = null,
  coordinates = null,
  address = null,
  strategies,
  selected,
  climate,
  explanation,
  weights,
  priorities = null,
  investigationResult = null,
  isDemo,
}: Props) {
  const ranked = [...strategies].sort((a, b) => b.overallScore - a.overallScore)
  const seasons = climate.seasons
  const avg = Math.round(seasons.reduce((a, s) => a + s.rainfallMm, 0) / seasons.length)
  const driest = seasons.reduce((a, b) => (b.rainfallMm < a.rainfallMm ? b : a))
  const unusual = seasons.filter((s) => s.isAnomaly)

  const activePriorities = priorities ?? defaultPriorities
  const bighaApprox = (hectares * 7.47).toFixed(2)
  const acreApprox = (hectares * 2.47105).toFixed(2)

  return (
    <article
      id="report-root"
      className="rounded-2xl border border-forest/10 bg-white p-8 text-forest shadow-sm"
    >
      {/* ── Header band ─────────────────────────────────────────── */}
      <header className="mb-6">
        <div className="-mx-8 -mt-8 mb-5 bg-forest px-8 py-5 text-ivory print:-mx-8 print:-mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/70">
              FieldShift · Land Intelligence Report
            </p>
            <span className="rounded-full border border-ivory/25 bg-white/10 px-3 py-1 font-mono text-[11px] font-bold">
              {investigationResult?.investigation_id ?? "inv-assessment"}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {profile?.farmName ?? "Crop rotation assessment"}
          </h1>
          <p className="mt-1 text-sm text-ivory/80">
            Crop rotation assessment · Prepared{" "}
            {new Date().toLocaleDateString([], {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {isDemo && (
          <p className="mb-4 rounded-lg border border-sun/60 bg-sun/10 px-3 py-2 text-xs text-forest">
            <strong className="text-sun">DEMO DATA.</strong> Numbers, crop timings, and
            explanations are simulated placeholders. Consult local agricultural authorities for
            actual field management.
          </p>
        )}

        <p className="text-[11px] text-forest/60">
          <span className="font-bold text-sun">*</span> = measured or entered for this farm;
          verify against local records before acting.
        </p>
      </header>

      {/* ── 1. Field information ───────────────────────────────── */}
      <Section title="Field information">
        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          <div>
            {profile ? (
              <dl>
                <Row label="Farm name" value={profile.farmName} />
                <Row
                  label="Field area"
                  star
                  value={
                    hectares > 0
                      ? `${hectares.toFixed(2)} ha (${corners} corners)`
                      : "Not drawn"
                  }
                />
                <Row
                  label="Field coordinates"
                  star
                  value={
                    coordinates ? (
                      <span className="font-mono text-xs">
                        {formatCoordinates(coordinates.lat, coordinates.lng)} (
                        {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)})
                      </span>
                    ) : (
                      <span className="text-forest/60 italic">Coordinates unlisted</span>
                    )
                  }
                />
                {address && (
                  <Row
                    label="Location"
                    star
                    value={
                      <span>
                        {[
                          address.village,
                          address.city !== address.village ? address.city : null,
                          address.district,
                          address.state,
                          address.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || address.formatted}
                      </span>
                    }
                  />
                )}
                <Row
                  label="Current rotation"
                  star
                  value={profile.rotation.map((r) => r.crop).join(" → ")}
                />
                <Row
                  label="Soil pH"
                  star
                  value={profile.soilPh === "" ? "Unknown (not provided)" : profile.soilPh}
                />
                <Row
                  label="Organic carbon"
                  star
                  value={
                    profile.organicCarbon === ""
                      ? "Unknown (not provided)"
                      : `${profile.organicCarbon}%`
                  }
                />
                <Row label="Soil texture" star value={textureLabel[profile.soilTexture]} />
                <Row label="Water availability" star value={waterLabel[profile.water]} />
              </dl>
            ) : (
              <p className="text-sm text-forest/70">No farm details were entered.</p>
            )}
          </div>

          <div className="flex flex-col items-center justify-start rounded-2xl border border-forest/10 bg-forest/5 p-4 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-forest/70">
              Field boundary
            </p>
            <div className="h-36 w-full">
              <FieldBoundarySvg polygon={polygon} />
            </div>
            <div className="mt-3 w-full border-t border-forest/10 pt-2 text-center">
              <p className="font-mono text-sm font-bold text-forest">
                Approx. {bighaApprox} bigha
              </p>
              <p className="text-xs text-forest/70">(~{acreApprox} acres)</p>
              <p className="mt-1 text-[10px] text-forest/60 italic">
                * Approx. local area based on mapped polygon
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-forest/60">
          * Approximation note: Regional land measurement units vary by state. In Eastern India /
          Bengal standard, 1 hectare is approximately 7.47 bigha (~2.471 acres); actual cadastral
          revenue survey measurements may differ.
        </p>
      </Section>

      {/* ── 2. Priorities ──────────────────────────────────────── */}
      <Section title="Farmer evaluation priorities">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(priorityLabels) as (keyof Priorities)[]).map((key) => {
            const meta = priorityLabels[key]
            const val = activePriorities[key] ?? 0.5
            return (
              <div
                key={String(key)}
                className="flex items-center justify-between gap-3 rounded-xl border border-forest/10 bg-forest/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-forest">{meta.label}</span>
                  <p className="text-[10px] text-forest/60">{meta.hint}</p>
                </div>
                <div className="w-20">
                  <ScoreBar value={Math.round(val * 100)} />
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── 3. Environmental observations ──────────────────────── */}
      <Section title="Environmental observations & NASA POWER records">
        <dl>
          <Row
            label="Period analysed"
            value={
              investigationResult?.earth_obs
                ? `${investigationResult.earth_obs.start_date} to ${investigationResult.earth_obs.end_date}`
                : `${seasons[0].year} to ${seasons[seasons.length - 1].year}`
            }
          />
          <Row
            label="Average seasonal rainfall"
            star
            value={
              investigationResult?.earth_obs
                ? `${investigationResult.earth_obs.precipitation_mm.toFixed(0)} mm total`
                : `${avg} mm`
            }
          />
          <Row
            label="Mean temperature"
            star
            value={
              investigationResult?.earth_obs
                ? `${investigationResult.earth_obs.temperature_c.toFixed(1)} °C`
                : "25.9 °C"
            }
          />
          <Row
            label="Driest season"
            star
            value={`${driest.year} (${driest.rainfallMm} mm)`}
          />
          <Row
            label="Unusual seasons"
            star
            value={`${unusual.length} of ${seasons.length}: ${unusual.map((s) => s.year).join(", ")}`}
          />
          <Row
            label="Data source"
            value={investigationResult?.earth_obs?.source ?? climate.source}
          />
        </dl>
        <p className="mt-2 text-xs text-forest/60">
          Grid resolution:{" "}
          {investigationResult?.earth_obs?.grid_resolution_deg ?? 0.5}° (~50 km cell). Local
          micro-climates and immediate topography may cause variations.
        </p>
      </Section>

      {investigationResult?.agronomy && (
        <Section title="Agronomic assessment & soil health">
          <dl>
            <Row
              label="Soil pH status"
              star
              value={
                investigationResult.agronomy.soil_assessment.ph
                  ? `${investigationResult.agronomy.soil_assessment.ph.value} (${investigationResult.agronomy.soil_assessment.ph.status.replace("_", " ")})`
                  : "Not tested"
              }
            />
            <Row
              label="Organic carbon status"
              star
              value={
                investigationResult.agronomy.soil_assessment.organic_carbon_pct
                  ? `${investigationResult.agronomy.soil_assessment.organic_carbon_pct.value}% (${investigationResult.agronomy.soil_assessment.organic_carbon_pct.status.replace("_", " ")})`
                  : "Not tested"
              }
            />
            {Boolean(investigationResult.agronomy.planting_window_conflicts?.length) && (
              <Row
                label="Window conflicts"
                value={(investigationResult.agronomy.planting_window_conflicts || []).join("; ")}
              />
            )}
          </dl>
        </Section>
      )}

      {/* ── 5. Strategies ──────────────────────────────────────── */}
      <Section title="Proposed crop rotation strategies">
        <table className="mb-5 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-forest/20 text-left text-[11px] uppercase tracking-wider text-forest/60">
              <th className="py-2 pr-2 font-semibold">Rank</th>
              <th className="py-2 pr-2 font-semibold">Strategy</th>
              <th className="py-2 pr-2 font-semibold">Crop sequence</th>
              <th className="py-2 text-right font-semibold">Overall fit</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((s, i) => (
              <tr key={s.id} className="border-b border-forest/8">
                <td className="py-2 pr-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-ivory">
                    {i + 1}
                  </span>
                </td>
                <td className="py-2 pr-2 font-medium">{s.name}</td>
                <td className="py-2 pr-2">{s.sequence.map((c) => c.crop).join(" → ")}</td>
                <td className="py-2">
                  <div className="flex justify-end">
                    <ScoreBar value={s.overallScore} color={kindColor[s.kind]} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          className="break-inside-avoid overflow-hidden rounded-xl border border-forest/15"
          style={{ borderLeft: `4px solid ${kindColor[selected.kind]}` }}
        >
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest/50">
              Selected for review
            </p>
            <h3 className="text-lg font-bold">{selected.name}</h3>
            <p className="mb-3 text-sm">
              {selected.sequence.map((c) => `${c.season}: ${c.crop}`).join(" → ")}
            </p>

            <div className="mb-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {scoreMeta.map((m) => (
                <div key={m.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-forest/70">{m.label}</span>
                  <ScoreBar value={selected.scores[m.key]} color={kindColor[selected.kind]} />
                </div>
              ))}
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="font-semibold">Potential benefits</p>
                <ul className="list-disc pl-5">
                  {selected.benefits.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Trade-offs</p>
                <ul className="list-disc pl-5">
                  {selected.drawbacks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Flagged risks</p>
                <ul className="list-disc pl-5">
                  {selected.risks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Missing data</p>
                {selected.missingData.length === 0 ? (
                  <p>None reported.</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {selected.missingData.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <p className="mt-3 text-sm">
              <strong>Why this strategy:</strong> {explanation.why.text}
            </p>

            <p className="mt-2 text-xs text-forest/60">
              Priority weights used for scoring: Water ({weights.water}), Soil ({weights.soil}),
              Climate ({weights.climate}), Economic ({weights.profit}), Operational ease (
              {weights.effort}).
            </p>
          </div>
        </div>
      </Section>

      {/* ── 6. Advisor synthesis ───────────────────────────────── */}
      <Section title="Advisor synthesis & recommendations">
        <p className="mb-3 text-sm leading-relaxed">
          {investigationResult?.advisor?.overview ??
            "This investigation evaluates crop rotation options against historical climate variability, soil organic carbon restoration targets, and economic viability."}
        </p>

        {investigationResult?.advisor?.comparison && (
          <div className="mb-3 rounded-xl border border-forest/10 bg-forest/5 p-3 text-sm">
            <strong>Comparative analysis:</strong> {investigationResult.advisor.comparison}
          </div>
        )}

        {investigationResult?.advisor?.recommendation_note && (
          <div className="mb-3 rounded-xl border-l-4 border-l-forest bg-forest/5 p-3 text-sm">
            <strong>Recommendation note:</strong>{" "}
            {investigationResult.advisor.recommendation_note}
          </div>
        )}

        {investigationResult?.advisor?.next_steps && (
          <div className="mt-3">
            <p className="text-sm font-semibold">Recommended next steps</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {investigationResult.advisor.next_steps.map((step: string, idx: number) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* ── 7. Evidence ────────────────────────────────────────── */}
      <Section title="Evidence sources">
        <ul className="space-y-2 text-sm">
          {explanation.evidence.map((e) => (
            <li key={e.id} className="break-inside-avoid">
              <span className="mr-1.5 inline-flex h-5 w-8 items-center justify-center rounded bg-forest/10 font-mono text-[10px] font-bold text-forest">
                {e.id}
              </span>
              {kindLabel[e.kind]}: {e.title}
              <br />
              <span className="pl-10 text-forest/70">
                {e.dataset} · {e.date} · {e.resolution}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── 8. Reminders ───────────────────────────────────────── */}
      <Section title="Reminders for human validation">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            This document supports decision-making. It does not instruct planting or input changes.
          </li>
          <li>
            {selected.needsExpertValidation
              ? "This strategy is flagged for validation by a local agricultural expert before any decision."
              : "Even without specific flags, please confirm the plan with a local agricultural extension office."}
          </li>
          <li>Verify local seed availability, cultivar adaptation, and market prices locally.</li>
          <li>Verify soil moisture in your own field before making irrigation decisions.</li>
        </ul>
      </Section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-8 border-t-2 border-forest pt-3 text-[10px] text-forest/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>FieldShift · Land Intelligence Report</span>
          <span>
            Generated{" "}
            {new Date().toLocaleString([], {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="mt-1 italic">
          Scores compare options against each other using the available evidence; they do not
          predict yield or income. Not a substitute for professional agronomic advice.
        </p>
      </footer>
    </article>
  )
}
