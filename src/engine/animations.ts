import type { AnimationMap } from './types';

export const defaultAnimations: AnimationMap = {
  idle: { row: 0, frames: 6, frameDuration: 200 },
  walk: { row: 1, frames: 6, frameDuration: 160 },
  sleep: { row: 2, frames: 6, frameDuration: 360 },
  jump: { row: 3, frames: 6, frameDuration: 160 },
  roll: { row: 4, frames: 6, frameDuration: 200 },
  attack: { row: 5, frames: 6, frameDuration: 120 },
  run: { row: 1, frames: 6, frameDuration: 100 },
};
