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
  direction?: PetDirection
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
  setPetAnchor: (id: string, x: number, y: number) => void
}

export type PetDirection = 'right' | 'left'

export type FreePetPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'

export type FloorPetPosition = 'left' | 'center' | 'right'

export type PetPosition = FreePetPosition | FloorPetPosition

export type ResolvePetAnchorOptions = {
  position: FreePetPosition | FloorPetPosition
  canvasWidth: number
  canvasHeight: number
  edgePadding: number
  hasFloor: boolean
  floorOffset: number
}

export type PetAnchor = {
  x: number
  y: number
}