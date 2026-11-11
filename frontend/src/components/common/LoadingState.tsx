import { motion } from "framer-motion"

type LoadingProps = {
  message?: string
  subtext?: string
}

export function LoadingState({
  message = "Loading satellite insights…",
  subtext = "Aggregating environmental layers and field metrics",
}: LoadingProps) {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-6">
      <div className="relative flex max-w-sm flex-col items-center rounded-2xl liquid-glass p-8 text-center shadow-lg border border-forest/10">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-forest/15 border-t-forest"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          <img src="/src/assets/logo.png" alt="Loading" className="h-8 w-8 object-contain" />
        </div>
        <p className="text-sm font-semibold text-forest">{message}</p>
        <p className="mt-1 text-xs text-forest/60 leading-relaxed">{subtext}</p>
      </div>
    </div>
  )
}
