import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { EASE_OUT_EXPO } from "@/lib/motion"

const wordVariants = {
  hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: EASE_OUT_EXPO },
  },
}

export function PageHeader({
  title,
  description,
}: {
  title: string
  description?: ReactNode
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
      }}
      className="mb-5"
    >
      <h1
        aria-label={title}
        className="font-brand text-3xl md:text-4xl font-bold tracking-tight text-[#1E241B] not-italic leading-tight"
      >
        {title.split(" ").map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            aria-hidden
            variants={wordVariants}
            className="inline-block whitespace-pre"
          >
            {word}
            {i < title.split(" ").length - 1 ? " " : ""}
          </motion.span>
        ))}
      </h1>
      {description && (
        <motion.p
          variants={wordVariants}
          className="mt-1 text-xs md:text-sm text-[#5C5A52] leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  )
}
