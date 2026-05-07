import { loadSprite } from './spriteLoader'
import type { PetEngineOptions, PetState, PetEngine } from './types'

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

  const petStates: PetState[] = options.pets.map((pet)=>({
    id: pet.id,
    config: pet,
    image: null,
    loaded: false,
    error: null,
    animation: 'idle',
    frameIndex: 0,
    frameElapsed: 0,
  }))

  void loadPets()

  return {
    start,
    stop,
    destroy,
    resize,
    setPetAnchor,
  };

  async function loadPets(): Promise<void>{
    await Promise.all(
      petStates.map(async (state)=>{
        try{
          state.image = await loadSprite(state.config.src)
          state.loaded = true
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

  function draw(): void {
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  
    for (const state of petStates) {
      if (!state.loaded || !state.image) {
        continue
      }
  
      const animation = options.animations[state.animation]
      const scale = state.config.scale ?? 1
      const frameWidth = options.spriteSheet.frameWidth ?? state.image.width / options.spriteSheet.cols
      const frameHeight = options.spriteSheet.frameHeight ?? state.image.height / options.spriteSheet.rows

      const sourceX = state.frameIndex * frameWidth
      const sourceY = animation.row * frameHeight
      const targetWidth = frameWidth * scale
      const targetHeight = frameHeight * scale

      const anchorX = state.config.x
      const anchorY = state.config.y
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
  
}