import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, FlaskConical, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import AgentStepper from "@/agent-control/AgentStepper"
import EventTerminal from "@/agent-control/EventTerminal"
import { agents } from "@/agent-control/agents"
import { useInvestigationStream } from "@/hooks/useInvestigationStream"
import { useFarmStore } from "@/store/useFarmStore"

export default function MissionControl() {
  const navigate = useNavigate()
  const { events, status, restart, isDemo } = useInvestigationStream()
  const { profile, hectares } = useFarmStore()

  const completed = agents.filter((a) => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].agent === a.id) return events[i].status === "completed"
    }
    return false
  }).length
  const progress = status === "done" ? 100 : Math.round((completed / agents.length) * 100)

  return (
    <>
      <PageHeader
        title="Mission Control"
        description="Watch the agents investigate your field, step by step."
      />

      {isDemo && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
          <p>
            <strong>Demo simulation.</strong> This is a scripted preview of the
            investigation flow, not real agent output. It switches to live events
            when the backend is connected.
          </p>
        </div>
      )}

      {!profile && (
        <p className="mb-6 text-sm text-forest/70">
          No farm details yet.{" "}
          <Link to="/field" className="font-semibold underline">
            Draw a field and fill in the form first.
          </Link>
        </p>
      )}
      {profile && (
        <p className="mb-6 text-sm text-forest/70">
          Investigating <strong>{profile.farmName}</strong>
          {hectares > 0 && <> ({hectares.toFixed(2)} ha)</>}
        </p>
      )}

      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">
            {status === "done" ? "Investigation complete" : status === "error" ? "Connection lost" : "Investigating…"}
          </span>
          <span className="text-forest/60">{progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-forest/10">
          <motion.div
            className="h-full rounded-full bg-forest"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AgentStepper events={events} />
        <EventTerminal events={events} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={restart} className="h-12 rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" />
          Replay
        </Button>
        {status === "done" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={() => navigate("/findings")} className="h-12 rounded-xl">
              Review strategies
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </>
  )
}