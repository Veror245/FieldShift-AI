import { useCallback, type ReactNode } from "react"

export function useSpotlight<T extends HTMLElement>() {
  const ref = useCallback((el: T | null) => {
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty("--mx", `${e.clientX - r.left}px`)
      el.style.setProperty("--my", `${e.clientY - r.top}px`)
    }
    el.addEventListener("mousemove", onMove)
    return () => el.removeEventListener("mousemove", onMove)
  }, [])
  return ref
}

export function GlassCard({
  icon,
  badge,
  title,
  tagline,
  description,
  tags = [],
  onClick,
}: {
  icon?: ReactNode
  badge?: ReactNode
  title: string
  tagline?: string
  description?: string
  tags?: string[]
  onClick?: () => void
}) {
  const spotlightRef = useSpotlight<HTMLElement>()

  return (
    <article
      ref={spotlightRef}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.12] border-t-white/[0.30] bg-white/[0.05] backdrop-blur-2xl transition-[border-color,box-shadow] duration-300 hover:border-white/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.08), transparent 65%)",
        }}
      />

      <div className="relative flex h-full flex-col p-4 sm:p-5">
        {(icon || badge) && (
          <div className="mb-3 flex items-start justify-between gap-3">
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 border-t-white/25 bg-white/[0.06]">
                {icon}
              </div>
            )}
            {badge}
          </div>
        )}

        <h3 className="font-semibold tracking-[-0.015em] text-current text-[14.5px]">
          {title}
        </h3>
        {tagline && (
          <p className="mt-0.5 font-medium opacity-65 text-[11.5px]">
            {tagline}
          </p>
        )}
        {description && (
          <p className="mt-1.5 text-[11px] leading-relaxed opacity-50">
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="flex min-w-0 flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] tracking-tight leading-none opacity-60"
                >
                  {tag}
                </span>
              ))}
            </span>

            <svg
              className="h-3.5 w-3.5 shrink-0 opacity-40 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        )}
      </div>
    </article>
  )
}
