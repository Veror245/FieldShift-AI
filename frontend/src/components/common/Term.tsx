import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { glossary, type GlossaryKey } from "@/lib/glossary"

const TIP_WIDTH = 256
const MARGIN = 12
const TIP_HEIGHT_GUESS = 190

type Pos = { left: number; width: number; above: boolean; y: number }

export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const entry = glossary[k]
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Pos>({ left: 0, width: TIP_WIDTH, above: false, y: 0 })
  const rootRef = useRef<HTMLSpanElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const id = useId()

  const show = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.min(TIP_WIDTH, window.innerWidth - MARGIN * 2)
    // Center under the icon, then keep it inside the screen
    const left = Math.min(
      Math.max(r.left + r.width / 2 - width / 2, MARGIN),
      window.innerWidth - width - MARGIN
    )
    // Flip above the icon if there is no room below
    const above = r.bottom + TIP_HEIGHT_GUESS > window.innerHeight && r.top > TIP_HEIGHT_GUESS
    const y = above ? window.innerHeight - r.top + 8 : r.bottom + 8
    setPos({ left, width, above, y })
    setOpen(true)
  }

  const close = () => setOpen(false)

  // Close on outside tap, scroll or resize
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [open])

  return (
    <span
      ref={rootRef}
      className="inline-flex items-center gap-1.5"
      onMouseEnter={show}
      onMouseLeave={close}
    >
      {children ?? entry.label}

      <motion.button
        ref={btnRef}
        type="button"
        aria-label={`What is ${entry.label}?`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => (open ? close() : show())}
        onFocus={show}
        onBlur={close}
        onKeyDown={(e) => e.key === "Escape" && close()}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="inline-flex h-[18px] w-[18px] cursor-help items-center justify-center rounded-full bg-forest font-serif text-[11px] font-bold leading-none text-ivory shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-sage"
      >
        i
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              id={id}
              role="tooltip"
              initial={{ opacity: 0, y: pos.above ? 6 : -6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pos.above ? 4 : -4, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              style={{
                position: "fixed",
                left: pos.left,
                width: pos.width,
                ...(pos.above ? { bottom: pos.y } : { top: pos.y }),
                transformOrigin: pos.above ? "bottom center" : "top center",
              }}
              className="pointer-events-none z-[100] rounded-xl bg-forest p-3 text-left text-sm font-normal leading-relaxed text-ivory shadow-xl"
            >
              <strong className="mb-1 block text-sage">{entry.label}</strong>
              {entry.text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  )
}