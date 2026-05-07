import type { ResolvePetAnchorOptions, PetAnchor } from "./types";

export function resolvePetAnchor(
  options: ResolvePetAnchorOptions
): PetAnchor{
  const {
    position,
    canvasWidth,
    canvasHeight,
    edgePadding,
    hasFloor,
    floorOffset,
  } = options

  const left = edgePadding
  const centerX = canvasWidth / 2
  const right = canvasWidth - edgePadding

  // 有設定地板的情形下
  if(hasFloor) { 
    const floorY = canvasHeight - floorOffset
    
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
  const top = edgePadding
  const centerY = canvasHeight / 2
  const bottom = canvasHeight - edgePadding

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