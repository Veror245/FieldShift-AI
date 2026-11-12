import { motion } from "framer-motion"
import { AlertTriangleIcon, CheckCircleIcon, CircleIcon } from "@/components/common/Icons"
import ThinkingOrb from "@/components/common/ThinkingOrb"
import type { AgentEvent } from "@/types/api"
import type { ThinkingOrbState } from "@/utils/thinkingOrbs"
import { agents } from "./agents"

type State = AgentEvent["status"] | "idle"

const agentOrbState: Record<AgentEvent["agent"], ThinkingOrbState> = {
  supervisor: "working",
  earth_observation: "searching",
  climate: "solving",
  agronomy: "shaping",
  planner: "composing",
  auditor: "listening",
  advisor: "composing",
}

function lastEventOf(agent: AgentEvent["agent"], events: AgentEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].agent === agent) return events[i]
  return undefined
}

function StatusIcon({ state, agentId }: { state: State; agentId: AgentEvent["agent"] }) {
  if (state === "completed") return <CheckCircleIcon className="h-5 w-5 text-[#4E633D]" />
  if (state === "warning") return <AlertTriangleIcon className="h-5 w-5 text-[#A66843]" />
  if (state === "started" || state === "running") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5DFD0] border border-[#C8BFA9] text-[11px] font-semibold text-[#3A4B2D] shadow-sm">
        <ThinkingOrb state={agentOrbState[agentId]} size={20} speed={1.3} theme="dark" />
        <span className="uppercase tracking-wider text-[10px]">Active</span>
      </div>
    )
  }
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
            <div className="relative shrink-0">
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-all overflow-hidden ${
                  active
                    ? "bg-[#EAE4D5] border-2 border-[#4E633D] shadow-md ring-2 ring-[#4E633D]/20"
                    : state === "completed"
                      ? "bg-[#E5DFD0] border border-[#BACBB0] text-[#4E633D]"
                      : state === "warning"
                        ? "bg-[#E5DFD0] border border-[#D9BEAE] text-[#A66843]"
                        : "bg-[#E5DFD0] text-[#5C5A52]"
                }`}
              >
                {active ? (
                  <div className="flex items-center justify-center p-0.5">
                    <ThinkingOrb state={agentOrbState[id]} size={40} speed={1.25} theme="dark" />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              {state === "completed" && (
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4E633D] text-white shadow-sm ring-2 ring-[#F2EDE2]">
                  <CheckCircleIcon className="h-3 w-3 text-white" />
                </div>
              )}
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
                  <StatusIcon state={state} agentId={id} />
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
