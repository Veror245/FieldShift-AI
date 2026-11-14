import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDownIcon, CheckIcon } from "@/components/common/Icons"
import { playChipClickSfx } from "@/utils/uiSoundEngine"

export type SelectOption = {
  value: string
  label: string
}

type Props = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function GlassSelect({ value, options, onChange, placeholder = "Select option", className }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [open])

  const toggle = () => {
    playChipClickSfx()
    setOpen((prev) => !prev)
  }

  const select = (val: string) => {
    playChipClickSfx()
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={toggle}
        className={
          className ||
          "h-11 w-full box-border rounded-xl border border-forest/15 bg-white px-3.5 text-sm text-forest flex items-center justify-between shadow-xs outline-none focus:ring-2 focus:ring-sage transition-all text-left"
        }
      >
        <span className="truncate font-medium">{selected ? selected.label : placeholder}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDownIcon className="h-4 w-4 text-forest/60 shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl bg-white border border-forest/15 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            <div className="max-h-56 overflow-y-auto space-y-1">
              {options.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => select(opt.value)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                      isSelected
                        ? "bg-forest/10 font-bold text-forest border border-forest/20"
                        : "text-stone-800 hover:bg-forest/5"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckIcon className="h-4 w-4 text-forest shrink-0" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
