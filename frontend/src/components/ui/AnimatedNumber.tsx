import { useMemo } from "react"
import { motion } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const digitSpring = { type: "spring", stiffness: 300, damping: 28 } as const

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const text = useMemo(() => {
    const v = Number.isFinite(value) ? value : 0
    return v.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }, [value, decimals])

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`}>
      {prefix && <span className="whitespace-pre">{prefix}</span>}
      <span className="inline-flex items-baseline">
        {text.split("").map((ch, i) => {
          if (ch >= "0" && ch <= "9") {
            const d = Number(ch)
            return (
              <span
                key={i}
                className="inline-block overflow-hidden align-baseline"
                style={{ height: "1em" }}
                aria-hidden
              >
                <motion.span
                  className="flex flex-col"
                  initial={{ y: "0em" }}
                  animate={{ y: `${-d}em` }}
                  transition={digitSpring}
                >
                  {DIGITS.map((n) => (
                    <span key={n} style={{ height: "1em", lineHeight: 1 }}>
                      {n}
                    </span>
                  ))}
                </motion.span>
              </span>
            )
          }
          return (
            <span key={i} className="whitespace-pre">
              {ch}
            </span>
          )
        })}
      </span>
      {suffix && <span className="whitespace-pre">{suffix}</span>}
      <span className="sr-only">{text}</span>
    </span>
  )
}
