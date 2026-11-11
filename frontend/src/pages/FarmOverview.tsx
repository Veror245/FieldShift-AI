import { useQuery } from "@tanstack/react-query"
import { motion, type Variants } from "framer-motion"
import { getStrategies } from "@/services/api"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import { Term } from "@/components/common/Term"

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

export default function FarmOverview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["strategies"],
    queryFn: getStrategies,
  })

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Farm Overview"
          description={
            <>
              Satellite data such as <Term k="ndvi" /> and{" "}
              <Term k="soilMoisture" /> helps explore better crop rotations.
            </>
          }
        />
      </motion.div>

      {isLoading && (
        <Skeleton className="h-32 w-full rounded-2xl bg-[#E5DFD0] border border-[#D4CCB9]" />
      )}
      {isError && <p className="text-[#A66843]">Something went wrong.</p>}

      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
        {data?.map((s) => (
          <Card
            key={s.id}
            className="rounded-2xl p-5"
          >
            <h2 className="font-semibold text-base text-[#1E241B]">{s.name}</h2>
            <p className="mt-1 text-sm text-[#5C5A52]">
              {s.sequence.map((c) => c.crop).join(" → ")}
            </p>
          </Card>
        ))}
      </motion.div>
    </motion.div>
  )
}
