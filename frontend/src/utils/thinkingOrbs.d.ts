export type ThinkingOrbState =
  | "working"
  | "searching"
  | "solving"
  | "listening"
  | "composing"
  | "shaping"

export type ThinkingOrbTheme = "auto" | "dark" | "light"

export type ThinkingOrbOptions = {
  state?: ThinkingOrbState
  size?: number
  speed?: number
  theme?: ThinkingOrbTheme
  paused?: boolean
}

export function thinkingOrbs(
  scope?: Document | Element | null,
  options?: ThinkingOrbOptions
): () => void
