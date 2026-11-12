import ThinkingOrb from "./ThinkingOrb"
import type { ThinkingOrbState } from "@/utils/thinkingOrbs"

type LoadingProps = {
  message?: string
  subtext?: string
  state?: ThinkingOrbState
  size?: number
}

export function LoadingState({
  message = "Loading satellite insights…",
  subtext = "Aggregating environmental layers and field metrics",
  state = "searching",
  size = 56,
}: LoadingProps) {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-6">
      <div className="relative flex max-w-sm flex-col items-center rounded-2xl liquid-glass p-8 text-center shadow-lg border border-forest/10">
        <div className="relative mb-4 flex items-center justify-center">
          <ThinkingOrb state={state} size={size} />
        </div>
        <p className="text-sm font-semibold text-forest">{message}</p>
        <p className="mt-1 text-xs text-forest/60 leading-relaxed">{subtext}</p>
      </div>
    </div>
  )
}
