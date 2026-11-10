import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Circle, Loader2 } from "lucide-react"
import type { AgentEvent } from "@/types/api"
import { agents } from "./agents"

type State = AgentEvent["status"] | "idle"

function lastEventOf(agent: AgentEvent["agent"], events: AgentEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].agent === agent) return events[i]
  return undefined
}

function StatusIcon({ state }: { state: State }) {
  if (state === "completed") return <CheckCircle2 className="h-5 w-5 text-forest" />
  if (state === "warning") return <AlertTriangle className="h-5 w-5 text-sun" />
  if (state === "started" || state === "running")
    return <Loader2 className="h-5 w-5 animate-spin text-forest" />
  return <Circle className="h-5 w-5 text-forest/25" />
}

export default function AgentStepper({ events }: { events: AgentEvent[] }) {
  return (
    <ol className="space-y-3">
      {agents.map(({ id, label, role, icon: Icon }) => {
        const last = lastEventOf(id, events)
        const state: State = last?.status ?? "idle"
        const active = state === "started" || state === "running"
        const revisions = events.filter((e) => e.agent === id && e.status === "started").length

        return (
          <motion.li
            key={id}
            layout
            className={`relative flex gap-4 rounded-2xl border p-4 transition-colors ${
              active
                ? "border-sage bg-white shadow-md"
                : state === "warning"
                  ? "border-sun/60 bg-sun/5"
                  : state === "completed"
                    ? "border-forest/15 bg-white"
                    : "border-forest/10 bg-white/50"
            }`}
          >
            <div className="relative">
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-xl bg-sage"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${
                  state === "idle" ? "bg-forest/10 text-forest/40" : "bg-forest text-ivory"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{label}</p>
                <div className="flex items-center gap-2">
                  {id === "planner" && revisions > 1 && (
                    <span className="rounded-full bg-sun/15 px-2 py-0.5 text-xs font-medium text-sun">
                      Revised after audit
                    </span>
                  )}
                  <StatusIcon state={state} />
                </div>
              </div>
              <p className="text-xs text-forest/60">{role}</p>
              {last && <p className="mt-2 text-sm text-forest/80">{last.message}</p>}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}