import {
  uiSoundEngine,
  playTabSwitchSfx,
  playChipClickSfx,
  playHoverTickSfx,
} from "@/utils/uiSoundEngine"

export const sound = {
  playTick: (pitch?: number) => uiSoundEngine.playTick(pitch),
  playTabSwitch: () => uiSoundEngine.playTabSwitchSfx(),
  playChipClick: () => uiSoundEngine.playChipClickSfx(),
  playHoverTick: () => uiSoundEngine.playHoverTickSfx(),
}

export { playTabSwitchSfx, playChipClickSfx, playHoverTickSfx }
