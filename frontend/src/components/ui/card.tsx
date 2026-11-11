import * as React from "react"
import { cn } from "cn"
import { useSpotlight } from "@/components/common/GlassCard"

function Card({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  const spotlightRef = useSpotlight<HTMLDivElement>()

  return (
    <div
      ref={spotlightRef}
      data-slot="card"
      data-size={size}
      className={cn(
        "group relative flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl border border-white/40 border-t-white/[0.85] bg-[#F2EDE2]/80 backdrop-blur-2xl py-(--card-spacing) text-sm text-[#1E241B] shadow-[0_4px_20px_rgba(42,38,30,0.06)] [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)] transition-[border-color,box-shadow] duration-300 hover:border-white/70 hover:shadow-[0_20px_50px_rgba(42,38,30,0.12),inset_0_1px_0_rgba(255,255,255,0.5)]",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(126,145,103,0.08), transparent 65%)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-(--card-spacing) h-full w-full">
        {children}
      </div>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium text-[#1E241B] group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs text-[#5C5A52]", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-(--card-spacing)", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
