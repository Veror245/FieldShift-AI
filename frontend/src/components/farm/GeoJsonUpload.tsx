import { useRef, useState, type DragEvent } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { parseFieldGeoJSON, type ParsedField } from "@/lib/geojson"

export default function GeoJsonUpload({ onLoaded }: { onLoaded: (f: ParsedField) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const readFile = async (file: File) => {
    try {
      if (file.size > 5_000_000) throw new Error("This file is too large. Please use a file under 5 MB.")
      const parsed = parseFieldGeoJSON(await file.text())
      onLoaded(parsed)
      toast.success(`Field boundary loaded (${parsed.hectares.toFixed(2)} ha).`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read this file.")
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void readFile(file)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-4 sm:p-5 text-center transition-all ${
        over
          ? "border-[#4E633D] bg-[#EAE4D5] shadow-md scale-[1.01]"
          : "border-[#C9C0AC] bg-gradient-to-b from-[#FBF9F5] to-[#F1ECE1] hover:border-[#4E633D] hover:bg-[#FAF6ED] shadow-xs"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void readFile(file)
          e.target.value = ""
        }}
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <motion.div
          animate={over ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#D4CCB9] shadow-xs text-[#4E633D] group-hover:border-[#4E633D] group-hover:bg-[#EAE4D5]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </motion.div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#4E633D] px-3 py-1.5 text-xs font-semibold text-[#F2EDE2] shadow-xs transition-colors group-hover:bg-[#3D4F30]">
            Upload GeoJSON boundary
          </span>
          <p className="mt-1.5 text-xs text-[#5C5A52]">
            or drag & drop your file here (.geojson, .json up to 5 MB)
          </p>
        </div>
      </div>
    </div>
  )
}