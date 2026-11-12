import { useRef, useState, type DragEvent } from "react"
import { FileUp } from "lucide-react"
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
      className={`rounded-xl border border-dashed p-4 text-center text-sm transition-colors ${
        over ? "border-forest bg-sage/20" : "border-sage"
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4"
      >
        <FileUp className="h-4 w-4" />
        Upload a GeoJSON boundary
      </button>
      <p className="mt-1 text-xs text-forest/60">or drop the file here (.geojson or .json)</p>
    </div>
  )
}