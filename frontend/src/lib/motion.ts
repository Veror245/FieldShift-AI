import type { Transition, Variants } from "framer-motion"

export const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const pageExitTransition: Transition = {
  duration: 0.22,
  ease: "easeIn",
}

export const pageContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

export const pageItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE_OUT_EXPO },
  },
}

export const softSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
}
