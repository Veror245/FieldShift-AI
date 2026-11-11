import { useState, useEffect } from "react"

const STORAGE_KEY = "fieldshift_sfx_muted"

type SoundName =
  | "button"
  | "caution"
  | "celebration"
  | "disabled"
  | "notification"
  | "select"
  | "swipe"
  | "tap_01"
  | "tap_02"
  | "tap_03"
  | "tap_04"
  | "tap_05"
  | "toggle_on"
  | "toggle_off"
  | "transition_up"
  | "transition_down"

class UiSoundEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false
  private audioBuffers: Map<string, AudioBuffer> = new Map()
  private listeners: Set<(muted: boolean) => void> = new Set()
  private loadStarted: boolean = false

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.muted = localStorage.getItem(STORAGE_KEY) === "true"
      } catch {
        this.muted = false
      }

      const unlock = () => {
        this.initContext()
        this.preloadSounds()
        window.removeEventListener("pointerdown", unlock)
        window.removeEventListener("keydown", unlock)
      }
      window.addEventListener("pointerdown", unlock, { once: true, passive: true })
      window.addEventListener("keydown", unlock, { once: true, passive: true })
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private async preloadSounds(): Promise<void> {
    if (this.loadStarted || typeof window === "undefined") return
    this.loadStarted = true
    const ctx = this.initContext()
    if (!ctx) return

    const soundFiles: SoundName[] = [
      "transition_up",
      "transition_down",
      "select",
      "button",
      "tap_01",
      "tap_02",
      "tap_03",
      "tap_04",
      "tap_05",
      "toggle_on",
      "toggle_off",
      "caution",
      "celebration",
      "notification",
    ]

    for (const name of soundFiles) {
      try {
        const res = await fetch(`/sounds/${name}.wav`)
        if (res.ok) {
          const arr = await res.arrayBuffer()
          const decoded = await ctx.decodeAudioData(arr)
          this.audioBuffers.set(name, decoded)
        }
      } catch {
      }
    }
  }

  private playBuffer(name: SoundName, volume = 0.5): boolean {
    if (this.muted) return false
    const ctx = this.initContext()
    if (!ctx) return false

    const buf = this.audioBuffers.get(name)
    if (!buf) {
      if (!this.loadStarted) this.preloadSounds()
      return false
    }

    try {
      const src = ctx.createBufferSource()
      const gain = ctx.createGain()
      src.buffer = buf
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start()
      return true
    } catch {
      return false
    }
  }

  public isSfxMuted(): boolean {
    return this.muted
  }

  public setSfxMuted(muted: boolean): void {
    this.muted = muted
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "true" : "false")
    } catch {
    }
    this.listeners.forEach((fn) => fn(this.muted))
  }

  public toggleSfxMute(): boolean {
    const next = !this.muted
    this.setSfxMuted(next)
    if (!next) {
      if (!this.playBuffer("toggle_on", 0.6)) {
        this.playChipClickSfx()
      }
    }
    return next
  }

  private currentTabSource: AudioBufferSourceNode | null = null

  public subscribe(fn: (muted: boolean) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  public playTabSwitchSfx(): void {
    if (this.muted) return

    if (this.currentTabSource) {
      try {
        this.currentTabSource.stop()
        this.currentTabSource.disconnect()
      } catch {
      }
      this.currentTabSource = null
    }

    const ctx = this.initContext()
    if (!ctx) return

    const buf = this.audioBuffers.get("tap_01")
    if (buf) {
      try {
        const src = ctx.createBufferSource()
        const gain = ctx.createGain()
        src.buffer = buf
        gain.gain.setValueAtTime(0.22, ctx.currentTime)
        src.connect(gain)
        gain.connect(ctx.destination)
        src.onended = () => {
          if (this.currentTabSource === src) {
            this.currentTabSource = null
          }
        }
        src.start()
        this.currentTabSource = src
        return
      } catch {
      }
    }

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(420, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.016)
      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.02)
    } catch {
    }
  }

  public playChipClickSfx(): void {
    if (this.muted) return
    if (this.playBuffer("select", 0.35)) return

    try {
      const ctx = this.initContext()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(240, now)
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.022)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.026)
    } catch {
    }
  }

  public playHoverTickSfx(): void {}

  public playTick(pitch = 1): void {
    if (this.muted) return
    const taps: SoundName[] = ["tap_01", "tap_02", "tap_03", "tap_04", "tap_05"]
    const idx = Math.min(Math.max(Math.floor((pitch - 0.7) * 4), 0), taps.length - 1)
    if (this.playBuffer(taps[idx], 0.45)) return

    try {
      const ctx = this.initContext()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(860 * pitch, now)
      osc.frequency.exponentialRampToValueAtTime(320 * pitch, now + 0.018)
      gain.gain.setValueAtTime(0.07, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.025)
    } catch {
    }
  }

  public playCaution(): void {
    if (this.muted) return
    this.playBuffer("caution", 0.5)
  }

  public playCelebration(): void {
    if (this.muted) return
    this.playBuffer("celebration", 0.6)
  }

  public playToggle(on: boolean): void {
    if (this.muted) return
    this.playBuffer(on ? "toggle_on" : "toggle_off", 0.55)
  }

  public playTabSwitch(): void {
    this.playTabSwitchSfx()
  }
}

export const uiSoundEngine = new UiSoundEngine()

export const playTabSwitchSfx = () => uiSoundEngine.playTabSwitchSfx()
export const playChipClickSfx = () => uiSoundEngine.playChipClickSfx()
export const playHoverTickSfx = () => uiSoundEngine.playHoverTickSfx()
export const isSfxMuted = () => uiSoundEngine.isSfxMuted()
export const toggleSfxMute = () => uiSoundEngine.toggleSfxMute()
export const setSfxMuted = (m: boolean) => uiSoundEngine.setSfxMuted(m)
export const playCautionSfx = () => uiSoundEngine.playCaution()
export const playCelebrationSfx = () => uiSoundEngine.playCelebration()
export const playToggleSfx = (on: boolean) => uiSoundEngine.playToggle(on)

export function useSfxMute() {
  const [muted, setMuted] = useState(uiSoundEngine.isSfxMuted())

  useEffect(() => {
    return uiSoundEngine.subscribe((m) => setMuted(m))
  }, [])

  return {
    muted,
    toggleMute: () => uiSoundEngine.toggleSfxMute(),
    setMuted: (m: boolean) => uiSoundEngine.setSfxMuted(m),
  }
}
