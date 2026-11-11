import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#4E633D] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#4E633D] text-[#F7F4EC] font-bold hover:bg-[#3E5030] shadow-sm hover:shadow-md border border-[#3E5030]",
        outline:
          "border-[#C9C0AC] bg-[#F2EDE2] hover:bg-[#E5DFD0] text-[#1E241B]",
        secondary:
          "bg-[#E5DFD0] text-[#1E241B] hover:bg-[#DBD3C1] border border-[#C9C0AC] shadow-sm hover:shadow-md",
        ghost:
          "hover:bg-[#E5DFD0]/60 text-[#5C5A52] hover:text-[#1E241B]",
        destructive:
          "bg-[#A66843]/15 text-[#A66843] border border-[#A66843]/30 hover:bg-[#A66843]/25",
        link: "text-[#4E633D] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        xs: "h-7 rounded-lg px-2 text-xs",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "size-11",
        "icon-xs": "size-7 rounded-lg",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
