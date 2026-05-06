export type AnimationName =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sleep'
  | 'jump'
  | 'roll'
  | 'attack'

export type AnimationConfig = {
  row: number
  frames: number
  frameDuration: number
}

export type AnimationMap = Record<AnimationName, AnimationConfig>

export type SpriteSheetConfig = {
  cols: number
  rows: number
  frameWidth?: number
  frameHeight?: number
};

export type PetConfig = {
  id: string
  name?: string
  src: string
  x: number
  y: number
  scale?: number
}

export type PetState = {
  id: string
  config: PetConfig
  image: HTMLImageElement | null
  loaded: boolean
  error: Error | null
  animation: AnimationName
  frameIndex: number
  frameElapsed: number
}

export type PetEngineOptions = {
  pets: PetConfig[]
  spriteSheet: SpriteSheetConfig
  animations: AnimationMap
  animationSpeed?: number
}

export type PetEngine = {
  start: () => void
  stop: () => void
  destroy: () => void
  resize: (width: number, height: number) => void
}
