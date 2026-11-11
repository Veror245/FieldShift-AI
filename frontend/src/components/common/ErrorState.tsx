import { motion } from "framer-motion"
import { AlertTriangleIcon, RotateCcwIcon } from "@/components/common/Icons"
import { Button } from "@/components/ui/button"

type ErrorProps = {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Data retrieval failed",
  message = "Could not sync environmental data. Check your network connection and retry.",
  onRetry,
}: ErrorProps) {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex max-w-sm flex-col items-center rounded-2xl liquid-glass p-8 text-center shadow-lg border border-sun/30"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sun/15 border border-sun/30 text-sun shadow-sm">
          <AlertTriangleIcon className="h-7 w-7" />
        </div>
        <h3 className="text-sm font-bold text-forest">{title}</h3>
        <p className="mt-1.5 text-xs text-forest/70 leading-relaxed">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="mt-5 h-10 rounded-xl px-5 text-xs font-semibold shadow-md transition-all"
          >
            <RotateCcwIcon className="mr-1.5 h-3.5 w-3.5" />
            Try again
          </Button>
        )}
      </motion.div>
    </div>
  )
}
