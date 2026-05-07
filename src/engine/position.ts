import type { ResolvePetAnchorOptions, PetAnchor } from "./types";

export function resolvePetAnchor(
  options: ResolvePetAnchorOptions
): PetAnchor{
  const {
    position,
    canvasWidth,
    canvasHeight,
    targetWidth,
    targetHeight,
    edgePadding,
    hasFloor,
    floorOffset,
  } = options

  const minX = edgePadding + targetWidth / 2
  const maxX = canvasWidth - edgePadding - targetWidth / 2
  const hasHorizontalSpace = minX <= maxX

  const left = hasHorizontalSpace ? minX : canvasWidth / 2
  const centerX = canvasWidth / 2
  const right = hasHorizontalSpace ? maxX : canvasWidth / 2

  // 有設定地板的情形下
  if(hasFloor) { 
    const floorY = clamp(canvasHeight - floorOffset, targetHeight, canvasHeight)
    
    switch (position) {
      case 'left':
        return { x: left, y: floorY }
      case 'right':
        return { x: right, y: floorY }
      case 'center':
      default:
        return { x: centerX, y: floorY }
    }
  }

  // 九宮格情形下
  const minY = edgePadding + targetHeight
  const maxY = canvasHeight - edgePadding
  const hasVerticalSpace = minY <= maxY

  const top = hasVerticalSpace ? minY : canvasHeight / 2
  const centerY = canvasHeight / 2
  const bottom = hasVerticalSpace ? maxY : canvasHeight / 2

  switch (position) {
    case 'top-left':
      return { x: left, y: top }
    case 'top':
      return { x: centerX, y: top }
    case 'top-right':
      return { x: right, y: top }
    case 'left':
      return { x: left, y: centerY }
    case 'center':
      return { x: centerX, y: centerY }
    case 'right':
      return { x: right, y: centerY }
    case 'bottom-left':
      return { x: left, y: bottom }
    case 'bottom':
      return { x: centerX, y: bottom }
    case 'bottom-right':
    default:
      return { x: right, y: bottom }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
