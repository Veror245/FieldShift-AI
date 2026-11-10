import type { ReactNode } from "react"
import { motion } from "framer-motion"

export function PageHeader({
  title,
  description,
}: {
  title: string
  description?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold">{title}</h1>
      {description && <p className="mt-1 text-forest/70">{description}</p>}
    </motion.div>
  )
}