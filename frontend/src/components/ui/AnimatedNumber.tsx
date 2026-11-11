import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 650,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0)
  const prevValueRef = useRef<number>(0)
  const startTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const startVal = prevValueRef.current
    const targetVal = Number.isFinite(value) ? value : 0
    const change = targetVal - startVal
    startTimeRef.current = null

    if (duration <= 0 || change === 0) {
      setDisplayValue(targetVal)
      prevValueRef.current = targetVal
      return
    }

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuart(progress)
      const current = startVal + change * easedProgress

      setDisplayValue(current)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        setDisplayValue(targetVal)
        prevValueRef.current = targetVal
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
