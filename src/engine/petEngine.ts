import { loadSprite } from './spriteLoader'
import type { PetEngineOptions, PetState, PetEngine, PetSize, PetBounds } from './types'

const MOVEMENT_RESPONSE_MS = 120
const MOVEMENT_STOP_DISTANCE = 0.75
const DIRECTION_EPSILON = 0.25
const MIN_MOVEMENT_SPEED = 0.1
const MAX_MOVEMENT_SPEED = 5

export function createPetEngine(
  canvas: HTMLCanvasElement,
  options: PetEngineOptions,
): PetEngine {

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  let animationFrameId = 0
  let lastTickTime = 0
  let movementSpeed = getClampedMovementSpeed(options.movementSpeed)

  const petStates: PetState[] = options.pets.map((pet)=>({
    id: pet.id,
    config: pet,
    image: null,
    loaded: false,
    error: null,
    animation: 'idle',
    frameIndex: 0,
    frameElapsed: 0,
    targetX: pet.x,
    targetY: pet.y
  }))

  void loadPets()

  return {
    start,
    stop,
    destroy,
    resize,
    getPetSize,
    getPetBounds,
    setPetAnchor,
    setPetTarget,
    setMovementSpeed,
  };

  async function loadPets(): Promise<void>{
    await Promise.all(
      petStates.map(async (state)=>{
        try{
          state.image = await loadSprite(state.config.src)
          state.loaded = true
          const size = getPetSize(state.id)
          if (size) {
            options.onPetLoad?.(size)
          }
        }catch(err){
          state.error = err instanceof Error ? err : new Error(String(err)) 
        }
      })
    )
  }

  function start(): void{
    if(animationFrameId){
      return
    }
    lastTickTime = performance.now()
    animationFrameId = requestAnimationFrame(tick)
  }

  function stop(): void{
    if(!animationFrameId){
      return
    }
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }

  function destroy(): void{
    stop()
    petStates.length = 0
  }

  function resize(width:number, height:number): void{
    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx?.setTransform(ratio, 0,0, ratio, 0,0,)
  }

  function setPetAnchor(id: string, x: number, y: number): void{
    const state = petStates.find((pet)=> pet.id === id)
    if(!state) return

    state.config.x = x
    state.config.y = y
    state.targetX = x
    state.targetY = y
  }

  function setPetTarget(id: string, x: number, y: number): void{
    const state = petStates.find((pet)=> pet.id === id)
    if(!state) return

    state.targetX = x
    state.targetY = y
  }

  function setMovementSpeed(speed: number): void {
    movementSpeed = getClampedMovementSpeed(speed)
  }

  function getPetSize(id: string): PetSize | null {
    const state = petStates.find((pet) => pet.id === id)
    if (!state?.loaded || !state.image) {
      return null
    }

    return getStateSize(state)
  }

  function getPetBounds(id: string): PetBounds | null {
    const state = petStates.find((pet) => pet.id === id)
    if (!state?.loaded || !state.image) {
      return null
    }

    return getStateBounds(state)
  }

  function tick(time:number): void{
    const delta = time - lastTickTime
    lastTickTime = time

    update(delta)
    draw()

    animationFrameId = requestAnimationFrame(tick)
  }

  function update(delta: number): void {
    const animationSpeed = getAnimationSpeed()
    for (const state of petStates) {
      updateMovement(state, delta)

      const animation = options.animations[state.animation]
      const frameDuration = animation.frameDuration / animationSpeed

      state.frameElapsed += delta
      while (state.frameElapsed >= frameDuration) {
        state.frameIndex = (state.frameIndex + 1) % animation.frames
        state.frameElapsed -= frameDuration
      }
    }
  }

  function getAnimationSpeed(): number {
    const speed = options.animationSpeed ?? 1
  
    return Math.min(Math.max(speed, 0.1), 10)
  }

  function updateMovement(state: PetState, delta: number): void {
    const target = resolveBoundedTarget(state)
    const dx = target.x - state.config.x
    const dy = target.y - state.config.y
    const distance = Math.hypot(dx, dy)

    if (distance <= MOVEMENT_STOP_DISTANCE) {
      state.config.x = target.x
      state.config.y = target.y
      setAnimation(state, 'idle')
      return
    }

    const responseMs = MOVEMENT_RESPONSE_MS / movementSpeed
    const movementFactor = 1 - Math.exp(-delta / responseMs)
    state.config.x += dx * movementFactor
    state.config.y += dy * movementFactor

    if (Math.abs(dx) > DIRECTION_EPSILON) {
      state.config.direction = dx < 0 ? 'left' : 'right'
    }

    setAnimation(state, 'walk')
  }

  function resolveBoundedTarget(state: PetState): { x: number; y: number } {
    if (!state.loaded || !state.image) {
      return { x: state.targetX, y: state.targetY }
    }

    const { targetWidth, targetHeight } = getStateSize(state)

    return {
      x: clamp(
        state.targetX,
        targetWidth / 2,
        canvas.clientWidth - targetWidth / 2,
      ),
      y: clamp(
        state.targetY,
        targetHeight,
        canvas.clientHeight,
      ),
    }
  }

  function setAnimation(state: PetState, animation: PetState['animation']): void {
    if (state.animation === animation) {
      return
    }

    state.animation = animation
    state.frameIndex = 0
    state.frameElapsed = 0
  }

  function draw(): void {
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  
    for (const state of petStates) {
      if (!state.loaded || !state.image) {
        continue
      }
  
      const animation = options.animations[state.animation]
      const { frameWidth, frameHeight, targetWidth, targetHeight } = getStateSize(state)

      const sourceX = state.frameIndex * frameWidth
      const sourceY = animation.row * frameHeight

      const anchorX = clamp(
        state.config.x,
        targetWidth / 2,
        canvas.clientWidth - targetWidth / 2,
      )
      const anchorY = clamp(
        state.config.y,
        targetHeight,
        canvas.clientHeight,
      )
      const drawX = anchorX - targetWidth / 2
      const drawY = anchorY - targetHeight

      const direction = state.config.direction ?? 'right'
  
      if (!ctx) return console.warn('Missing canvas element')
      if (direction === 'left') {
        ctx.save()
        ctx.scale(-1, 1)
        ctx.drawImage(
          state.image,
          sourceX,
          sourceY,
          frameWidth,
          frameHeight,
          -drawX - targetWidth,
          drawY,
          targetWidth,
          targetHeight,
        )
        ctx.restore()
      } else {
        ctx.drawImage(
          state.image,
          sourceX,
          sourceY,
          frameWidth,
          frameHeight,
          drawX,
          drawY,
          targetWidth,
          targetHeight,
        )
      }      
    }
  }

  function getStateSize(state: PetState): PetSize {
    if (!state.image) {
      throw new Error(`Cannot read size for unloaded pet: ${state.id}`)
    }

    const scale = state.config.scale ?? 1
    const frameWidth = options.spriteSheet.frameWidth ?? state.image.width / options.spriteSheet.cols
    const frameHeight = options.spriteSheet.frameHeight ?? state.image.height / options.spriteSheet.rows

    return {
      id: state.id,
      frameWidth,
      frameHeight,
      targetWidth: frameWidth * scale,
      targetHeight: frameHeight * scale,
    }
  }

  function getStateBounds(state: PetState): PetBounds {
    const { targetWidth, targetHeight } = getStateSize(state)
    const anchorX = clamp(
      state.config.x,
      targetWidth / 2,
      canvas.clientWidth - targetWidth / 2,
    )
    const anchorY = clamp(
      state.config.y,
      targetHeight,
      canvas.clientHeight,
    )

    return {
      id: state.id,
      left: anchorX - targetWidth / 2,
      top: anchorY - targetHeight,
      right: anchorX + targetWidth / 2,
      bottom: anchorY,
      width: targetWidth,
      height: targetHeight,
    }
  }

  function clamp(value: number, min: number, max: number): number {
    if (min > max) {
      return (min + max) / 2
    }

    return Math.min(Math.max(value, min), max)
  }

  function getClampedMovementSpeed(speed = 1): number {
    return clamp(speed, MIN_MOVEMENT_SPEED, MAX_MOVEMENT_SPEED)
  }
  
}
