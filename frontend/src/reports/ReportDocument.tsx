import type { ReactNode } from "react"
import { scoreMeta } from "@/lib/scoreLabels"
import { weightMeta, type Weights } from "@/lib/scoring"
import type { FarmProfile } from "@/types/farm"
import type { ClimateFindings, EvidenceKind, Strategy, StrategyExplanation } from "@/types/api"

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

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 border-b border-forest/15 pb-1 text-lg font-bold">
        {n}. {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-forest/5 py-1.5 text-sm">
      <dt className="w-44 shrink-0 text-forest/60">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

type Props = {
  profile: FarmProfile | null
  hectares: number
  corners: number
  strategies: Strategy[]
  selected: Strategy
  climate: ClimateFindings
  explanation: StrategyExplanation
  weights: Weights
  isDemo: boolean
}

export default function ReportDocument({
  profile,
  hectares,
  corners,
  strategies,
  selected,
  climate,
  explanation,
  weights,
  isDemo,
}: Props) {
  const ranked = [...strategies].sort((a, b) => b.overallScore - a.overallScore)
  const seasons = climate.seasons
  const avg = Math.round(seasons.reduce((a, s) => a + s.rainfallMm, 0) / seasons.length)
  const driest = seasons.reduce((a, b) => (b.rainfallMm < a.rainfallMm ? b : a))
  const unusual = seasons.filter((s) => s.isAnomaly)

  return (
    <article
      id="report-root"
      className="rounded-2xl border border-forest/10 bg-white p-8 text-forest shadow-sm"
    >
      <header className="mb-8 border-b-2 border-forest pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest/60">FieldShift AI</p>
        <h1 className="text-2xl font-bold">Crop rotation assessment</h1>
        <p className="mt-1 text-sm text-forest/70">
          Prepared {new Date().toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })}
          {profile ? ` for ${profile.farmName}` : ""}
        </p>
        {isDemo && (
          <p className="mt-3 rounded-lg border border-sun bg-sun/10 p-3 text-sm">
            <strong>DEMO DATA.</strong> Every number, crop timing and explanation in this document
            is a placeholder used to preview the layout. It is not a real assessment.
          </p>
        )}
      </header>

      <Section n={1} title="Field information">
        {profile ? (
          <dl>
            <Row label="Farm name" value={profile.farmName} />
            <Row label="Field area" value={hectares > 0 ? `${hectares.toFixed(2)} ha (${corners} corners)` : "Not drawn"} />
            <Row label="Current rotation" value={profile.rotation.join(" → ")} />
            <Row label="Soil pH" value={profile.soilPh === "" ? "Unknown (not provided)" : profile.soilPh} />
            <Row
              label="Organic matter"
              value={profile.organicMatter === "" ? "Unknown (not provided)" : `${profile.organicMatter}%`}
            />
            <Row label="Soil texture" value={textureLabel[profile.soilTexture]} />
            <Row label="Water availability" value={waterLabel[profile.water]} />
          </dl>
        ) : (
          <p className="text-sm text-forest/70">No farm details were entered.</p>
        )}
      </Section>

      <Section n={2} title="Environmental observations">
        <dl>
          <Row label="Period analysed" value={`${seasons[0].year} to ${seasons[seasons.length - 1].year}`} />
          <Row label="Average seasonal rainfall" value={`${avg} mm`} />
          <Row label="Driest season" value={`${driest.year} (${driest.rainfallMm} mm)`} />
          <Row label="Unusual seasons" value={`${unusual.length} of ${seasons.length}: ${unusual.map((s) => s.year).join(", ")}`} />
          <Row label="Data source" value={climate.source} />
        </dl>
        <p className="mt-2 text-xs text-forest/60">{climate.resolutionNote}</p>
      </Section>

      <Section n={3} title="Analysis results">
        <ul className="mb-3 space-y-1 text-sm">
          {climate.clusters.map((c) => {
            const years = seasons.filter((s) => s.cluster === c.id).map((s) => s.year)
            return (
              <li key={c.id}>
                <strong>{c.name}</strong> ({years.length} seasons): {c.description}
              </li>
            )
          })}
        </ul>
        <p className="text-sm">
          <strong>Climate memory:</strong> {climate.currentSeason.summary} Seasons with a similar
          pattern: {climate.currentSeason.similar.map((s) => s.year).join(", ")}. Similar seasons do
          not mean similar crop yields.
        </p>
      </Section>

      <Section n={4} title="Proposed strategies">
        <table className="mb-5 w-full text-sm">
          <thead>
            <tr className="border-b border-forest/15 text-left text-forest/60">
              <th className="py-1.5 pr-2 font-medium">Rank</th>
              <th className="py-1.5 pr-2 font-medium">Strategy</th>
              <th className="py-1.5 pr-2 font-medium">Crop sequence</th>
              <th className="py-1.5 text-right font-medium">Overall fit</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((s, i) => (
              <tr key={s.id} className="border-b border-forest/5">
                <td className="py-1.5 pr-2">{i + 1}</td>
                <td className="py-1.5 pr-2 font-medium">{s.name}</td>
                <td className="py-1.5 pr-2">{s.sequence.map((c) => c.crop).join(" → ")}</td>
                <td className="py-1.5 text-right font-semibold">{s.overallScore}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="break-inside-avoid rounded-xl border border-forest/15 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest/50">Selected for review</p>
          <h3 className="text-lg font-bold">{selected.name}</h3>
          <p className="mb-3 text-sm">{selected.sequence.map((c) => `${c.season}: ${c.crop}`).join(" → ")}</p>

          <table className="mb-3 w-full text-sm">
            <tbody>
              {scoreMeta.map((m) => (
                <tr key={m.key} className="border-b border-forest/5">
                  <td className="py-1 pr-2 text-forest/70">{m.label}</td>
                  <td className="py-1 text-right font-semibold">{selected.scores[m.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">Potential benefits</p>
              <ul className="list-disc pl-5">{selected.benefits.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold">Trade-offs</p>
              <ul className="list-disc pl-5">{selected.drawbacks.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold">Flagged by the risk auditor</p>
              <ul className="list-disc pl-5">{selected.risks.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold">Missing data</p>
              {selected.missingData.length === 0 ? (
                <p>None reported.</p>
              ) : (
                <ul className="list-disc pl-5">{selected.missingData.map((t) => <li key={t}>{t}</li>)}</ul>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm">
            <strong>Why this strategy:</strong> {explanation.why.text}
          </p>
        </div>
      </Section>

      <Section n={5} title="Scoring methodology">
        <p className="mb-2 text-sm">
          Overall fit is a weighted average of normalised objective scores, S(r) = Σ wᵢ × sᵢ(r),
          where wᵢ is your priority weight. Hard agronomic constraints are checked separately and a
          high overall score never compensates for an unacceptable constraint. Scores compare the
          options with each other. They do not predict yield or income.
        </p>
        <p className="text-sm">
          Priority weights used:{" "}
          {weightMeta.map((m) => `${m.label} ${weights[m.key]}`).join(", ")}.
        </p>
      </Section>

      <Section n={6} title="Evidence sources">
        <ul className="space-y-2 text-sm">
          {explanation.evidence.map((e) => (
            <li key={e.id} className="break-inside-avoid">
              <strong>{e.id}</strong> · {kindLabel[e.kind]}: {e.title}
              <br />
              <span className="text-forest/70">
                {e.dataset} · {e.date} · {e.resolution}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section n={7} title="Limitations">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {explanation.limitations.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </Section>

      <Section n={8} title="Reminders for human validation">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>This document supports your decision. It does not instruct you to change planting, irrigation or inputs.</li>
          <li>
            {selected.needsExpertValidation
              ? "This strategy is flagged for validation by a local agricultural expert before any decision."
              : "Even without specific flags, please confirm the plan with a local agricultural expert."}
          </li>
          <li>Check regional planting windows, seed availability and market prices locally.</li>
          <li>Check soil moisture in your own field before irrigation decisions.</li>
        </ul>
      </Section>
    </article>
  )
}