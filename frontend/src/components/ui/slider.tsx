import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"
import { uiSoundEngine } from "@/utils/uiSoundEngine"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 5,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const lastSoundVal = React.useRef<number | null>(null)

  const handleValueChange = (newVal: number[]) => {
    if (newVal[0] !== lastSoundVal.current) {
      lastSoundVal.current = newVal[0]
      uiSoundEngine.playTick(0.85 + (newVal[0] / max) * 0.4)
    }
    onValueChange?.(newVal)
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const current = Array.isArray(value) ? value[0] : (defaultValue?.[0] ?? min)
    const delta = e.deltaY < 0 ? step : -step
    const nextVal = Math.min(max, Math.max(min, current + delta))
    if (nextVal !== current) {
      handleValueChange([nextVal])
    }
  }

  return (
    <div onWheel={handleWheel} className="w-full py-1">
      <SliderPrimitive.Root
        data-slot="slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={handleValueChange}
        className={cn(
          "relative flex w-full touch-none items-center select-none cursor-ew-resize data-disabled:opacity-50",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-[#DDD6C7] h-2.5 w-full border border-[#C9C0AC]"
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className="absolute bg-[#4E633D] select-none h-full rounded-full transition-all duration-75"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-5 shrink-0 rounded-full border-2 border-[#4E633D] bg-[#F2EDE2] shadow-sm transition-transform hover:scale-125 focus-visible:outline-none active:scale-95 cursor-grab active:cursor-grabbing"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  )
}

export { Slider }
