import { useEffect, useRef, type CSSProperties } from "react"
import {
  thinkingOrbs,
  type ThinkingOrbState,
  type ThinkingOrbTheme,
} from "@/utils/thinkingOrbs"

export type ThinkingOrbProps = {
  state?: ThinkingOrbState
  size?: number
  speed?: number
  theme?: ThinkingOrbTheme
  paused?: boolean
  className?: string
  style?: CSSProperties
  "aria-label"?: string
}

export default function ThinkingOrb({
  state = "working",
  size = 64,
  speed = 1,
  theme = "auto",
  paused = false,
  className,
  style,
  "aria-label": ariaLabel,
}: ThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const destroy = thinkingOrbs(canvas, {
      state,
      size,
      speed,
      theme,
      paused,
    })

    return () => {
      destroy()
    }
  }, [state, size, speed, theme, paused])

  return (
    <canvas
      ref={canvasRef}
      data-thinking-orb
      data-orb-state={state}
      data-orb-size={size}
      data-orb-speed={speed}
      data-orb-theme={theme}
      data-orb-paused={paused ? "true" : undefined}
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={style}
    />
  )
}
