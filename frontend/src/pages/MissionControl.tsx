import { Link, useNavigate } from "react-router-dom"
import { motion, type Variants } from "framer-motion"
import { ArrowRightIcon, FlaskIcon, RotateCcwIcon } from "@/components/common/Icons"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import AgentStepper from "@/agent-control/AgentStepper"
import EventTerminal from "@/agent-control/EventTerminal"
import { agents } from "@/agent-control/agents"
import { useInvestigationStream } from "@/hooks/useInvestigationStream"
import { useFarmStore } from "@/store/useFarmStore"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
}

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Mission Control"
          description="Watch the agents investigate your field, step by step."
        />
      </motion.div>

      {isDemo && (
        <motion.div
          variants={itemVariants}
          className="mb-4 flex items-start gap-3 rounded-2xl bg-[#A66843]/15 border border-[#A66843]/35 p-4 text-sm text-[#1E241B] shadow-sm"
        >
          <FlaskIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#A66843]" />
          <p>
            <strong className="text-[#A66843]">Demo simulation.</strong> This is a scripted preview of the
            investigation flow, not real agent output. It switches to live events
            when the backend is connected.
          </p>
        </motion.div>
      )}

      {!profile && (
        <motion.p variants={itemVariants} className="mb-4 text-sm text-[#5C5A52]">
          No farm details yet.{" "}
          <Link to="/field" className="font-semibold text-[#4E633D] underline">
            Draw a field and fill in the form first.
          </Link>
        </motion.p>
      )}
      {profile && (
        <motion.p variants={itemVariants} className="mb-4 text-sm text-[#5C5A52]">
          Investigating <strong className="text-[#1E241B]">{profile.farmName}</strong>
          {hectares > 0 && (
            <> (<AnimatedNumber value={hectares} decimals={2} suffix=" ha" />)</>
          )}
        </motion.p>
      )}

      <motion.div variants={itemVariants} className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-[#1E241B]">
            {status === "done" ? "Investigation complete" : status === "error" ? "Connection lost" : "Investigating…"}
          </span>
          <span className="text-[#4E633D] font-mono font-bold">
            <AnimatedNumber value={progress} decimals={0} suffix="%" />
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#E5DFD0] p-0.5 border border-[#C9C0AC]">
          <motion.div
            className="h-full rounded-full bg-[#4E633D] shadow-sm"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <AgentStepper events={events} />
        <EventTerminal events={events} />
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={restart}
          className="h-12 rounded-xl bg-[#E5DFD0] border border-[#C9C0AC] text-[#1E241B] shadow-sm hover:bg-[#DBD3C1] transition-all"
        >
          <RotateCcwIcon className="mr-2 h-4 w-4" />
          Replay
        </Button>
        {status === "done" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={() => navigate("/findings")}
              className="h-12 rounded-xl bg-[#4E633D] text-[#F7F4EC] font-bold shadow-md hover:bg-[#5D7749] transition-all"
            >
              Review strategies
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
