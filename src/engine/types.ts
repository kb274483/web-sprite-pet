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
  baseAnimation: AnimationName
  heldAnimation: AnimationName | null
  oneShotAnimation: AnimationName | null
  frameIndex: number
  frameElapsed: number
  targetX: number
  targetY: number
}

export type PetEngineOptions = {
  pets: PetConfig[]
  spriteSheet: SpriteSheetConfig
  animations: AnimationMap
  animationSpeed?: number
  movementSpeed?: number
  onPetLoad?: (pet: PetSize) => void
}

export type PetEngine = {
  start: () => void
  stop: () => void
  destroy: () => void
  resize: (width: number, height: number) => void
  getPetSize: (id: string) => PetSize | null
  getPetBounds: (id: string) => PetBounds | null
  setPetAnchor: (id: string, x: number, y: number) => void
  setPetTarget: (id: string, x: number, y: number) => void
  setMovementSpeed: (speed: number) => void
  playAnimation: (id: string, animation: AnimationName, options?: PlayAnimationOptions) => void
  clearHeldAnimation: (id: string) => void
}

export type PlayAnimationOptions = {
  mode?: 'hold' | 'once'
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
  targetWidth: number
  targetHeight: number
  edgePadding: number
  hasFloor: boolean
  floorOffset: number
}

export type PetAnchor = {
  x: number
  y: number
}

export type PetSize = {
  id: string
  frameWidth: number
  frameHeight: number
  targetWidth: number
  targetHeight: number
}

export type PetBounds = {
  id: string
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export type PetPointerBounds = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export type PetPointerEventDetail = {
  id: string
  pointerX: number
  pointerY: number
  bounds: PetPointerBounds
}
