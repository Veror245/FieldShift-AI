import { motion } from "framer-motion"
import { AlertTriangleIcon, CheckCircleIcon, CircleIcon, SpinnerIcon } from "@/components/common/Icons"
import type { AgentEvent } from "@/types/api"
import { agents } from "./agents"

type State = AgentEvent["status"] | "idle"

function lastEventOf(agent: AgentEvent["agent"], events: AgentEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].agent === agent) return events[i]
  return undefined
}

function StatusIcon({ state }: { state: State }) {
  if (state === "completed") return <CheckCircleIcon className="h-5 w-5 text-[#4E633D]" />
  if (state === "warning") return <AlertTriangleIcon className="h-5 w-5 text-[#A66843]" />
  if (state === "started" || state === "running")
    return <SpinnerIcon className="h-5 w-5 text-[#4E633D]" />
  return <CircleIcon className="h-5 w-5 text-[#5C5A52]/30" />
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
            className={`relative flex gap-4 rounded-2xl p-4 transition-all ${
              active
                ? "bg-[#F2EDE2] border-2 border-[#4E633D] shadow-md"
                : state === "warning"
                  ? "bg-[#F2EDE2] border-2 border-[#A66843] shadow-sm"
                  : state === "completed"
                    ? "bg-[#F2EDE2] border border-[#D4CCB9] shadow-sm"
                    : "bg-[#F2EDE2]/70 border border-[#D4CCB9]/70 opacity-80"
            }`}
          >
            <div className="relative">
              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${
                  state === "idle" ? "bg-[#E5DFD0] text-[#5C5A52]" : "bg-[#E5DFD0] text-[#4E633D]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[#1E241B]">{label}</p>
                <div className="flex items-center gap-2">
                  {id === "planner" && revisions > 1 && (
                    <span className="rounded-full bg-[#A66843]/15 border border-[#A66843]/30 px-2 py-0.5 text-xs font-medium text-[#A66843]">
                      Revised after audit
                    </span>
                  )}
                  <StatusIcon state={state} />
                </div>
              </div>
              <p className="text-xs text-[#5C5A52]">{role}</p>
              {last && <p className="mt-2 text-sm text-[#1E241B]/90">{last.message}</p>}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
