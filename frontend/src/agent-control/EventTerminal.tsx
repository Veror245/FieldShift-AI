import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { EASE_OUT_EXPO } from "@/lib/motion"
import type { AgentEvent } from "@/types/api"
import { agentLabel } from "./agents"

const dot: Record<AgentEvent["status"], string> = {
  started: "bg-[#7E9167]",
  running: "bg-[#7E9167]",
  completed: "bg-[#7E9167]",
  warning: "bg-[#A66843]",
}

const wordVariants = {
  hidden: { opacity: 0, y: 4, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: EASE_OUT_EXPO },
  },
}

/** Reveals an agent message word by word, like a live narration feed. */
function MessageText({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <motion.p
      className="text-[#F4F0E6]/90"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.018 } } }}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          aria-hidden
          variants={wordVariants}
          className="inline-block whitespace-pre"
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.p>
  )
}

export default function EventTerminal({ events }: { events: AgentEvent[] }) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" })
  }, [events.length])

  return (
    <div
      ref={boxRef}
      className="h-[560px] space-y-3 overflow-y-auto rounded-2xl bg-[rgba(34,32,28,0.92)] border border-[rgba(230,224,210,0.22)] p-5 text-[#F4F0E6] shadow-xl backdrop-blur-xl lg:h-[calc(100vh-260px)] lg:min-h-[400px]"
    >
      {events.length === 0 && <p className="text-sm text-[#A8A396]">Waiting for the first task…</p>}
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
              <span className="font-semibold text-[#8FA882]">{agentLabel(e.agent)}</span>{" "}
              <span className="text-[#8C877A]">
                {new Date(e.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </p>
            <MessageText text={e.message} />
            {e.source && (
              <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-[#C8C3B4] border border-white/15">
                Source: {e.source}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
