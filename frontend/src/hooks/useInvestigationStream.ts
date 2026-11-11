import { useCallback, useEffect, useState } from "react"
import type { AgentEvent } from "@/types/api"
import { BASE_URL, USE_MOCK } from "@/services/api"
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
    if (USE_MOCK) {
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
    }

    const es = new EventSource(`${BASE_URL}/investigations/${investigationId}/events`)
    es.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data) as AgentEvent
        setEvents((prev) => [...prev, ev])
        if (isFinal(ev)) {
          setStatus("done")
          es.close()
        }
      } catch {
      }
    }
    es.onerror = () => {
      setStatus("error")
      es.close()
    }
    return () => es.close()
  }, [investigationId, run])

  return { events, status, restart, isDemo: USE_MOCK }
}
