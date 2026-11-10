import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import type { AgentEvent } from "@/types/api"
import { agentLabel } from "./agents"

const dot: Record<AgentEvent["status"], string> = {
  started: "bg-sage",
  running: "bg-sage",
  completed: "bg-emerald-400",
  warning: "bg-sun",
}

export default function EventTerminal({ events }: { events: AgentEvent[] }) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" })
  }, [events.length])

  return (
    <div
      ref={boxRef}
      className="h-[560px] space-y-3 overflow-y-auto rounded-2xl bg-forest p-5 text-ivory"
    >
      {events.length === 0 && <p className="text-sm text-ivory/50">Waiting for the first task…</p>}
      {events.map((e) => (
        <motion.div
          key={e.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex gap-3 text-sm"
        >
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[e.status]}`} />
          <div className="min-w-0">
            <p>
              <span className="font-semibold text-sage">{agentLabel(e.agent)}</span>{" "}
              <span className="text-ivory/40">
                {new Date(e.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </p>
            <p className="text-ivory/90">{e.message}</p>
            {e.source && (
              <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-ivory/70">
                Source: {e.source}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}