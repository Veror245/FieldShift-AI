import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { FlaskConical } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { getExplanation, USE_MOCK } from "@/services/api"
import { pageContainer, pageItem } from "@/lib/motion"
import type { EvidenceKind, Level, Strategy } from "@/types/api"

const kindLabel: Record<EvidenceKind, string> = {
  observation: "Direct observation",
  derived: "Derived indicator",
  ml: "ML-discovered pattern",
  agronomy: "Agronomic knowledge",
  farmer: "Farmer-provided",
  llm: "AI-written wording",
}

const kindStyle: Record<EvidenceKind, string> = {
  observation: "bg-forest text-ivory",
  derived: "bg-forest/70 text-ivory",
  ml: "bg-sage text-forest",
  agronomy: "bg-sun/20 text-forest",
  farmer: "border border-forest/25 bg-white text-forest",
  llm: "bg-forest/10 text-forest/70",
}

const levelNum: Record<Level, number> = { low: 1, medium: 2, high: 3 }

type Question = {
  q: string
  text?: string
  list?: string[]
  empty?: string
  ids: string[]
}

function LevelBar({ label, level }: { label: string; level: Level }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-forest/70">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${i <= levelNum[level] ? "bg-forest" : "bg-forest/15"}`}
            />
          ))}
        </div>
        <span className="w-14 text-right text-xs font-semibold capitalize">{level}</span>
      </div>
    </div>
  )
}

function Cite({ ids, onPick }: { ids: string[]; onPick: (id: string) => void }) {
  if (ids.length === 0) return null
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(id)}
          className="rounded-md bg-forest/10 px-1.5 py-0.5 text-[11px] font-semibold text-forest hover:bg-forest hover:text-ivory"
        >
          {id}
        </button>
      ))}
    </span>
  )
}

type Props = { strategy: Strategy | null; onClose: () => void }

export default function WhyDrawer({ strategy, onClose }: Props) {
  const [highlight, setHighlight] = useState<string | null>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["explanation", strategy?.id],
    queryFn: () => getExplanation(strategy!.id),
    enabled: !!strategy,
  })

  const pick = (id: string) => {
    setHighlight(id)
    document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const questions: Question[] =
    data && strategy
      ? [
          { q: "Why was this strategy generated?", text: data.why.text, ids: data.why.evidenceIds },
          {
            q: "Which environmental observations influenced it?",
            text: data.observations.text,
            ids: data.observations.evidenceIds,
          },
          { q: "Which soil properties were considered?", text: data.soil.text, ids: data.soil.evidenceIds },
          {
            q: "Which crop characteristics affected its ranking?",
            text: data.crops.text,
            ids: data.crops.evidenceIds,
          },
          { q: "What potential benefits does it offer?", list: strategy.benefits, ids: ["E6"] },
          {
            q: "What are its drawbacks?",
            list: [...strategy.drawbacks, ...strategy.risks],
            ids: ["E6", "E7"],
          },
          {
            q: "Which data is missing?",
            list: strategy.missingData,
            empty: "No missing items were reported for this strategy.",
            ids: [],
          },
          {
            q: "What needs to be checked by a local agricultural expert?",
            text: strategy.needsExpertValidation
              ? "Please check the flagged risks and missing data with a local agricultural expert before any decision."
              : "Nothing is specifically flagged, but local validation is still advisable before changing your planting plan.",
            ids: ["E7"],
          },
        ]
      : []

  const used = new Set<string>(["E8"])
  questions.forEach((q) => q.ids.forEach((id) => used.add(id)))
  const evidence = data ? data.evidence.filter((e) => used.has(e.id)) : []

  return (
    <Sheet open={strategy !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-ivory p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-forest/10 p-6 text-left">
          <SheetTitle className="text-xl">Why &ldquo;{strategy?.name}&rdquo;?</SheetTitle>
          <SheetDescription>
            Every statement links to evidence below. Tap an ID such as E1 to jump to it.
          </SheetDescription>
        </SheetHeader>

        <motion.div
          variants={pageContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8 p-6"
        >
          {USE_MOCK && (
            <motion.div
              variants={pageItem}
              className="flex items-start gap-3 rounded-xl border border-sun/40 bg-sun/10 p-3 text-xs"
            >
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
              <p>
                <strong>Demo data.</strong> These explanations and evidence records are
                placeholders, not real analysis results.
              </p>
            </motion.div>
          )}

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-sun">Could not load the explanation. Please try again.</p>
          )}

          {data && (
            <>
              <motion.section
                variants={pageItem}
                className="space-y-3 rounded-2xl bg-white p-4"
              >
                <h3 className="font-semibold">How reliable is this?</h3>
                <LevelBar label="Data completeness" level={data.confidence.completeness} />
                <LevelBar label="Data recency" level={data.confidence.recency} />
                <LevelBar label="Observation resolution" level={data.confidence.resolution} />
                <p className="text-xs text-forest/60">{data.confidence.note}</p>
              </motion.section>

              <motion.section variants={pageItem} className="space-y-5">
                {questions.map((item, i) => (
                  <motion.div key={item.q} variants={pageItem}>
                    <p className="mb-1.5 text-sm font-semibold">
                      {i + 1}. {item.q}
                    </p>

                    {item.text && (
                      <p className="text-sm leading-relaxed text-forest/85">
                        {item.text}
                        <Cite ids={item.ids} onPick={pick} />
                      </p>
                    )}

                    {item.list && (
                      <>
                        {item.list.length === 0 ? (
                          <p className="text-sm text-forest/70">{item.empty}</p>
                        ) : (
                          <ul className="list-disc space-y-1 pl-5 text-sm text-forest/85">
                            {item.list.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        )}
                        <Cite ids={item.ids} onPick={pick} />
                      </>
                    )}
                  </motion.div>
                ))}
              </motion.section>

              <motion.section variants={pageItem}>
                <h3 className="mb-3 font-semibold">Evidence</h3>
                <div className="space-y-3">
                  {evidence.map((e) => (
                    <motion.div
                      key={e.id}
                      variants={pageItem}
                      id={`ev-${e.id}`}
                      className={`rounded-xl border bg-white p-4 text-sm transition-shadow ${
                        highlight === e.id ? "border-forest ring-2 ring-forest/30" : "border-forest/10"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-forest/10 px-1.5 py-0.5 text-[11px] font-semibold">
                          {e.id}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${kindStyle[e.kind]}`}
                        >
                          {kindLabel[e.kind]}
                        </span>
                      </div>
                      <p className="font-medium">{e.title}</p>
                      <dl className="mt-2 space-y-0.5 text-xs text-forest/70">
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-forest/50">Source</dt>
                          <dd>{e.dataset}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-forest/50">Date</dt>
                          <dd>{e.date}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-forest/50">Resolution</dt>
                          <dd>{e.resolution}</dd>
                        </div>
                      </dl>
                      {e.note && <p className="mt-2 text-xs text-forest/60">{e.note}</p>}
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={pageItem}>
                <h3 className="mb-2 font-semibold">Limitations</h3>
                <ul className="list-disc space-y-1 pl-5 text-xs text-forest/70">
                  {data.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </motion.section>
            </>
          )}
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}