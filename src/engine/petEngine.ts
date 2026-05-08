import { loadSprite } from './spriteLoader'
import { clamp } from './math'
import { setAnimation, setBaseAnimation, updateAnimationFrame } from './petAnimation'
import { drawPets, getPetBounds as getStateBounds, getPetSize as getStateSize, resizeCanvas } from './petCanvas'
import type { AnimationName, PetBounds, PetEngine, PetEngineOptions, PetSize, PetState, PlayAnimationOptions } from './types'

const MOVEMENT_RESPONSE_MS = 120
const MOVEMENT_STOP_DISTANCE = 0.75
const DIRECTION_EPSILON = 0.25
const MIN_MOVEMENT_SPEED = 0.1
const MAX_MOVEMENT_SPEED = 5

// engine 裡的 pet 座標一律當 bottom-center，也就是角色腳底中間的位置
export function createPetEngine(
  canvas: HTMLCanvasElement,
  options: PetEngineOptions,
): PetEngine {

  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) {
    throw new Error('Canvas 2D context is not available.');
  }
  const ctx: CanvasRenderingContext2D = canvasContext

  let animationFrameId = 0
  let lastTickTime = 0
  let movementSpeed = getClampedMovementSpeed(options.movementSpeed)

  // 每隻 pet 都有自己的動畫、載圖、移動目標狀態；目前 Web Component 只暴露 default pet
  const petStates: PetState[] = options.pets.map((pet)=>({
    id: pet.id,
    config: pet,
    image: null,
    loaded: false,
    error: null,
    animation: 'idle',
    baseAnimation: 'idle',
    heldAnimation: null,
    oneShotAnimation: null,
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
    playAnimation,
    clearHeldAnimation,
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
    resizeCanvas(canvas, ctx, width, height)
  }

  function setPetAnchor(id: string, x: number, y: number): void{
    const state = petStates.find((pet)=> pet.id === id)
    if(!state) return

    // 直接改 anchor 時也同步 target，避免 layout 更新後 pet 又慢慢滑回舊目標
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

  function playAnimation(
    id: string,
    animation: AnimationName,
    playOptions: PlayAnimationOptions = {},
  ): void {
    const state = petStates.find((pet) => pet.id === id)
    if (!state) return

    const mode = playOptions.mode ?? 'hold'

    if (mode === 'once') {
      // click 這類動畫播一次就好，播完後會回到 held 或 base animation
      state.oneShotAnimation = animation
      setAnimation(state, animation, true)
      return
    }

    // hover 這類動畫會 hold 住，但不打斷正在播放的一次性動畫
    state.heldAnimation = animation
    if (!state.oneShotAnimation) {
      setAnimation(state, animation)
    }
  }

  function clearHeldAnimation(id: string): void {
    const state = petStates.find((pet) => pet.id === id)
    if (!state) return

    state.heldAnimation = null
    if (!state.oneShotAnimation) {
      setAnimation(state, state.baseAnimation)
    }
  }

  function getPetSize(id: string): PetSize | null {
    const state = petStates.find((pet) => pet.id === id)
    if (!state?.loaded || !state.image) {
      return null
    }

    return getStateSize(state, options.spriteSheet)
  }

  function getPetBounds(id: string): PetBounds | null {
    const state = petStates.find((pet) => pet.id === id)
    if (!state?.loaded || !state.image) {
      return null
    }

    return getStateBounds(state, options.spriteSheet, {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    })
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

      updateAnimationFrame(state, options.animations, delta, animationSpeed)
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
      // 已經夠接近目標就直接貼齊，避免最後一點點距離一直抖動
      state.config.x = target.x
      state.config.y = target.y
      setBaseAnimation(state, 'idle')
      return
    }

    const responseMs = MOVEMENT_RESPONSE_MS / movementSpeed
    // 用時間比例做平滑追蹤，不管 FPS 高低都會有接近的手感
    const movementFactor = 1 - Math.exp(-delta / responseMs)
    state.config.x += dx * movementFactor
    state.config.y += dy * movementFactor

    if (Math.abs(dx) > DIRECTION_EPSILON) {
      // 只有水平移動夠明顯才翻方向，避免停下來附近一直左右跳
      state.config.direction = dx < 0 ? 'left' : 'right'
    }

    setBaseAnimation(state, 'walk')
  }

  function resolveBoundedTarget(state: PetState): { x: number; y: number } {
    if (!state.loaded || !state.image) {
      return { x: state.targetX, y: state.targetY }
    }

    const { targetWidth, targetHeight } = getStateSize(state, options.spriteSheet)

    // target 先限制在可見範圍內，draw 階段還會再做一次安全 clamp
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

  function draw(): void {
    drawPets({
      canvas,
      ctx,
      states: petStates,
      spriteSheet: options.spriteSheet,
      animations: options.animations,
    })
  }

  function getClampedMovementSpeed(speed = 1): number {
    return clamp(speed, MIN_MOVEMENT_SPEED, MAX_MOVEMENT_SPEED)
  }
  
}
