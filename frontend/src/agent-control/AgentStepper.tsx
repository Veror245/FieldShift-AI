import { motion } from "framer-motion"
import { AlertTriangleIcon, CheckCircleIcon, CircleIcon } from "@/components/common/Icons"
import ThinkingOrb from "@/components/common/ThinkingOrb"
import type { AgentEvent } from "@/types/api"
import type { ThinkingOrbState } from "@/utils/thinkingOrbs"
import { agents } from "./agents"

type State = AgentEvent["status"] | "idle" | "danger" | "error"

const agentOrbState: Record<AgentEvent["agent"], ThinkingOrbState> = {
  supervisor: "working",
  earth_observation: "searching",
  climate: "solving",
  agronomy: "shaping",
  planner: "composing",
  // kept for backend event compatibility; auditor is no longer shown in the UI
  auditor: "listening",
  advisor: "composing",
}

function lastEventOf(agent: AgentEvent["agent"], events: AgentEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].agent === agent) return events[i]
  return undefined
}

function StatusIcon({
  state,
  agentId,
  isDanger,
  isWarning,
}: {
  state: State
  agentId: AgentEvent["agent"]
  isDanger: boolean
  isWarning: boolean
}) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      {isDanger && <AlertTriangleIcon className="h-4 w-4 text-red-700" />}
      {!isDanger && isWarning && <AlertTriangleIcon className="h-4 w-4 text-yellow-800" />}
      {!isDanger && !isWarning && state === "completed" && (
        <CheckCircleIcon className="h-4 w-4 text-[#4E633D]" />
      )}
      {!isDanger && !isWarning && (state === "started" || state === "running") && (
        <ThinkingOrb state={agentOrbState[agentId]} size={16} speed={1.3} theme="auto" />
      )}
      {!isDanger && !isWarning && state === "idle" && (
        <CircleIcon className="h-4 w-4 text-[#5C5A52]/30" />
      )}
    </span>
  )
}

export default function AgentStepper({ events }: { events: AgentEvent[] }) {
  return (
    <ol className="relative space-y-2">
      <span
        aria-hidden
        className="absolute bottom-4 left-[30px] top-4 w-px bg-[#D4CCB9]"
      />
      {agents.map(({ id, label, role, icon: Icon }) => {
        const last = lastEventOf(id, events)
        const state: State = last?.status ?? "idle"
        const active = state === "started" || state === "running"
        const revisions = events.filter((e) => e.agent === id && e.status === "started").length

        const isDanger =
          (state as string) === "danger" ||
          (state as string) === "error" ||
          Boolean(last?.message && /(hazard|danger|conflict|fail|error|critical|unsuitable)/i.test(last.message))

        const isWarning =
          !isDanger &&
          (state === "warning" ||
            Boolean(last?.message && /(risk|warn|caution|deficit)/i.test(last.message)))

        return (
          <motion.li
            key={id}
            layout
            className={`relative flex gap-3 rounded-xl border p-2.5 sm:p-3 transition-colors ${
              isDanger
                ? "border-red-500 bg-red-100 text-red-950 shadow-sm"
                : isWarning
                  ? "border-yellow-500 bg-yellow-100 text-yellow-950 shadow-sm"
                  : active
                    ? "border-[#4E633D] bg-[#EAE4D5] shadow-sm"
                    : state === "completed"
                      ? "border-[#D4CCB9] bg-[#F2EDE2] shadow-xs"
                      : "border-[#D4CCB9]/60 bg-[#F2EDE2]/60 opacity-80"
            }`}
          >
            <div className="relative z-10 shrink-0">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-xs transition-colors ${
                  isDanger
                    ? "border-red-600 bg-red-200 text-red-900"
                    : isWarning
                      ? "border-yellow-600 bg-yellow-200 text-yellow-900"
                      : active
                        ? "border-[#4E633D] bg-[#DFD9C9] text-[#4E633D]"
                        : state === "completed"
                          ? "border-[#BACBB0] bg-[#E5DFD0] text-[#4E633D]"
                          : "border-[#D4CCB9]/60 bg-[#E5DFD0] text-[#5C5A52]"
                }`}
              >
                {active ? (
                  <ThinkingOrb state={agentOrbState[id]} size={26} speed={1.25} theme="dark" />
                ) : (
                  <Icon className="h-4.5 w-4.5" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-sm font-semibold truncate ${
                    isDanger ? "text-red-950" : isWarning ? "text-yellow-950" : "text-[#1E241B]"
                  }`}
                >
                  {label}
                </p>
                <StatusIcon
                  state={state}
                  agentId={id}
                  isDanger={isDanger}
                  isWarning={isWarning}
                />
              </div>
              <p
                className={`text-[11px] leading-tight ${
                  isDanger ? "text-red-900/80" : isWarning ? "text-yellow-900/80" : "text-[#5C5A52]"
                }`}
              >
                {role}
                {id === "planner" && revisions > 1 && (
                  <span
                    className={`ml-2 inline-block rounded-full px-1.5 py-0.2 text-[9.5px] font-semibold border ${
                      isDanger
                        ? "bg-red-200 border-red-400 text-red-900"
                        : isWarning
                          ? "bg-yellow-200 border-yellow-400 text-yellow-900"
                          : "bg-[#A66843]/15 border-[#A66843]/30 text-[#A66843]"
                    }`}
                  >
                    Revised
                  </span>
                )}
              </p>
              <p
                className={`mt-1 min-h-[1.1rem] text-xs leading-normal truncate ${
                  isDanger
                    ? "text-red-950 font-medium"
                    : isWarning
                      ? "text-yellow-950 font-medium"
                      : "text-[#1E241B]/90"
                }`}
              >
                {last?.message ?? ""}
              </p>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
