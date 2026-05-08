import { clamp } from './math'
import type { AnimationMap, PetBounds, PetSize, PetState, SpriteSheetConfig } from './types'

type CanvasViewport = {
  width: number
  height: number
}

type PetDrawOptions = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  states: PetState[]
  spriteSheet: SpriteSheetConfig
  animations: AnimationMap
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const ratio = window.devicePixelRatio || 1

  // canvas 實際像素跟 CSS 尺寸分開設，避免高 DPI 螢幕看起來糊掉
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
}

export function drawPets(options: PetDrawOptions): void {
  const { canvas, ctx, states, spriteSheet, animations } = options

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const state of states) {
    if (!state.loaded || !state.image) {
      continue
    }

    const animation = animations[state.animation]
    const { frameWidth, frameHeight, targetWidth, targetHeight } = getPetSize(state, spriteSheet)
    const { x: anchorX, y: anchorY } = getClampedAnchor(state, { width: canvas.clientWidth, height: canvas.clientHeight }, targetWidth, targetHeight)
    const sourceX = state.frameIndex * frameWidth
    const sourceY = animation.row * frameHeight
    const drawX = anchorX - targetWidth / 2
    const drawY = anchorY - targetHeight

    drawPetFrame(ctx, {
      image: state.image,
      sourceX,
      sourceY,
      frameWidth,
      frameHeight,
      drawX,
      drawY,
      targetWidth,
      targetHeight,
      direction: state.config.direction ?? 'right',
    })
  }
}

export function getPetSize(state: PetState, spriteSheet: SpriteSheetConfig): PetSize {
  if (!state.image) {
    throw new Error(`Cannot read size for unloaded pet: ${state.id}`)
  }

  const scale = state.config.scale ?? 1
  // 沒指定 frameWidth/frameHeight 時，就照 sprite sheet 的 cols/rows 自動切格
  const frameWidth = spriteSheet.frameWidth ?? state.image.width / spriteSheet.cols
  const frameHeight = spriteSheet.frameHeight ?? state.image.height / spriteSheet.rows

  return {
    id: state.id,
    frameWidth,
    frameHeight,
    targetWidth: frameWidth * scale,
    targetHeight: frameHeight * scale,
  }
}

export function getPetBounds(
  state: PetState,
  spriteSheet: SpriteSheetConfig,
  viewport: CanvasViewport,
): PetBounds {
  const { targetWidth, targetHeight } = getPetSize(state, spriteSheet)
  // bounds 跟 draw 用同一套 bottom-center 座標，hit test 才不會跟畫面對不起來
  const { x: anchorX, y: anchorY } = getClampedAnchor(state, viewport, targetWidth, targetHeight)

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

function getClampedAnchor(
  state: PetState,
  viewport: CanvasViewport,
  targetWidth: number,
  targetHeight: number,
): { x: number; y: number } {
  // draw/bounds 階段做安全 clamp，避免外部直接塞座標導致 sprite 超出 canvas
  return {
    x: clamp(state.config.x, targetWidth / 2, viewport.width - targetWidth / 2),
    y: clamp(state.config.y, targetHeight, viewport.height),
  }
}

function drawPetFrame(
  ctx: CanvasRenderingContext2D,
  options: {
    image: HTMLImageElement
    sourceX: number
    sourceY: number
    frameWidth: number
    frameHeight: number
    drawX: number
    drawY: number
    targetWidth: number
    targetHeight: number
    direction: 'left' | 'right'
  },
): void {
  const {
    image,
    sourceX,
    sourceY,
    frameWidth,
    frameHeight,
    drawX,
    drawY,
    targetWidth,
    targetHeight,
    direction,
  } = options

  // direction=left 用 canvas 翻轉，這樣不用另外準備一份反向 sprite
  if (direction === 'left') {
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(
      image,
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
    return
  }

  ctx.drawImage(
    image,
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
