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
}

export function GlassSelect({ value, options, onChange, placeholder = "Select option" }: Props) {
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
        className="h-11 w-full rounded-xl border border-[#C8BFA9] bg-[#E8E2D4] px-3.5 text-xs text-[#1E241B] flex items-center justify-between shadow-sm outline-none focus:border-[#63784E] focus:ring-2 focus:ring-[#63784E]/20 transition-all text-left"
      >
        <span className="truncate font-medium">{selected ? selected.label : placeholder}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDownIcon className="h-4 w-4 text-[#666257] shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full z-50 rounded-xl bg-[#F2EDE2] border border-[#D4CCB9] p-1.5 shadow-[0_12px_30px_rgba(42,38,30,0.14)]"
          >
            <div className="max-h-56 overflow-y-auto space-y-1">
              {options.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => select(opt.value)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-[#4E633D]/12 font-bold text-[#4E633D] border border-[#4E633D]/25"
                        : "text-[#2F362B] hover:bg-[#E5DFD0]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[#4E633D] shrink-0" />}
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
