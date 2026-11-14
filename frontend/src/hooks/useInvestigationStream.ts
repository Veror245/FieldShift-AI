import { useCallback, useEffect, useState } from "react"
import type { AgentEvent } from "@/types/api"
import { USE_MOCK } from "@/services/api"
import { mockEvents } from "@/mocks/investigationEvents"

export type StreamStatus = "running" | "done" | "error"

const isFinal = (e: AgentEvent) => e.agent === "supervisor" && e.status === "completed"

export function useInvestigationStream(investigationId = "demo") {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [status, setStatus] = useState<StreamStatus>("running")
  const [run, setRun] = useState(0)

  const restart = useCallback(() => {
    setEvents([])
    setStatus("running")
    setRun((r) => r + 1)
  }, [])

  useEffect(() => {
    const timers: number[] = []
    let t = 0
    mockEvents.forEach(({ delay, event }) => {
      t += delay
      timers.push(
        window.setTimeout(() => {
          const full: AgentEvent = { ...event, timestamp: new Date().toISOString() }
          setEvents((prev) => [...prev, full])
          if (isFinal(full)) setStatus("done")
        }, t)
      )
    })
    return () => timers.forEach(window.clearTimeout)
  }, [investigationId, run])

  return { events, status, restart, isDemo: USE_MOCK }
}
