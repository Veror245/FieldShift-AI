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

/** Fixed-size status slot so rows never change height or width between states. */
function StatusIcon({ state, agentId }: { state: State; agentId: AgentEvent["agent"] }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
      {state === "completed" && <CheckCircleIcon className="h-5 w-5 text-[#4E633D]" />}
      {state === "warning" && <AlertTriangleIcon className="h-5 w-5 text-[#A66843]" />}
      {(state === "started" || state === "running") && (
        <ThinkingOrb state={agentOrbState[agentId]} size={18} speed={1.3} theme="auto" />
      )}
      {state === "idle" && <CircleIcon className="h-5 w-5 text-[#5C5A52]/30" />}
    </span>
  )
}

export default function AgentStepper({ events }: { events: AgentEvent[] }) {
  return (
    <ol className="relative space-y-3">
      {/* vertical connector rail through the icon column */}
      <span
        aria-hidden
        className="absolute bottom-5 left-[43px] top-5 w-px bg-[#D4CCB9]"
      />
      {agents.map(({ id, label, role, icon: Icon }) => {
        const last = lastEventOf(id, events)
        const state: State = last?.status ?? "idle"
        const active = state === "started" || state === "running"
        const revisions = events.filter((e) => e.agent === id && e.status === "started").length

        return (
          <motion.li
            key={id}
            layout
            className={`relative flex gap-4 rounded-2xl border-2 p-4 transition-colors ${
              active
                ? "border-[#4E633D] bg-[#F2EDE2] shadow-md"
                : state === "warning"
                  ? "border-[#A66843] bg-[#F2EDE2] shadow-sm"
                  : state === "completed"
                    ? "border-[#D4CCB9] bg-[#F2EDE2] shadow-sm"
                    : "border-[#D4CCB9]/70 bg-[#F2EDE2]/70 opacity-80"
            }`}
          >
            <div className="relative z-10 shrink-0">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 shadow-sm transition-colors ${
                  active
                    ? "border-[#4E633D] bg-[#EAE4D5] text-[#4E633D]"
                    : state === "completed"
                      ? "border-[#BACBB0] bg-[#E5DFD0] text-[#4E633D]"
                      : state === "warning"
                        ? "border-[#D9BEAE] bg-[#E5DFD0] text-[#A66843]"
                        : "border-[#D4CCB9]/60 bg-[#E5DFD0] text-[#5C5A52]"
                }`}
              >
                {active ? (
                  <ThinkingOrb state={agentOrbState[id]} size={38} speed={1.25} theme="dark" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[#1E241B]">{label}</p>
                <StatusIcon state={state} agentId={id} />
              </div>
              <p className="text-xs text-[#5C5A52]">
                {role}
                {id === "planner" && revisions > 1 && (
                  <span className="ml-2 inline-block rounded-full bg-[#A66843]/15 border border-[#A66843]/30 px-2 py-px text-[10px] font-medium text-[#A66843]">
                    Revised after audit
                  </span>
                )}
              </p>
              {/* reserved message line: constant height whether or not there is a message */}
              <p className="mt-2 min-h-[1.25rem] text-sm text-[#1E241B]/90">{last?.message ?? ""}</p>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
