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
      initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
      className="mb-5"
    >
      <h1 className="font-brand text-3xl md:text-4xl font-bold tracking-tight text-[#1E241B] not-italic leading-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-xs md:text-sm text-[#5C5A52] leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  )
}
