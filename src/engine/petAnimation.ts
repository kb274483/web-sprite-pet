import type { AnimationMap, AnimationName, PetState } from './types'

export function setAnimation(
  state: PetState,
  animation: AnimationName,
  forceRestart = false,
): void {
  if (state.animation === animation && !forceRestart) {
    return
  }

  state.animation = animation
  state.frameIndex = 0
  state.frameElapsed = 0
}

export function setBaseAnimation(state: PetState, animation: AnimationName): void {
  state.baseAnimation = animation
  // held/one-shot 的優先序比 base 高，所以 base 只在沒有特殊動畫時才生效
  if (!state.heldAnimation && !state.oneShotAnimation) {
    setAnimation(state, animation)
  }
}

export function updateAnimationFrame(
  state: PetState,
  animations: AnimationMap,
  delta: number,
  animationSpeed: number,
): void {
  const animation = animations[state.animation]
  const frameDuration = animation.frameDuration / animationSpeed

  state.frameElapsed += delta
  while (state.frameElapsed >= frameDuration) {
    state.frameElapsed -= frameDuration

    if (state.oneShotAnimation && state.frameIndex >= animation.frames - 1) {
      // 一次性動畫播到最後一格後，回到 hover 動畫；沒有 hover 就回 idle/walk
      state.oneShotAnimation = null
      setAnimation(state, state.heldAnimation ?? state.baseAnimation)
      continue
    }

    state.frameIndex = (state.frameIndex + 1) % animation.frames
  }
}
