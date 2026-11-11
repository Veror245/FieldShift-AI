import { motion } from "framer-motion"
import { PageHeader } from "@/components/common/PageHeader"
import { Card } from "@/components/ui/card"

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <PageHeader title={title} description={description} />
      <Card className="rounded-2xl border border-dashed border-[#C9C0AC] bg-[#F2EDE2] p-12 text-center text-[#5C5A52] shadow-[0_4px_16px_rgba(42,38,30,0.05)]">
        Coming soon. This page is built later in the plan.
      </Card>
    </motion.div>
  )
}
