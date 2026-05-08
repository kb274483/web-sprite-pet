import { defaultAnimations } from './engine/animations'
import { readNumberAttribute, readStringAttribute } from './common/attributes'
import type {
  AnimationMap,
  AnimationName,
  FloorPetPosition,
  FreePetPosition,
  PetDirection,
} from './engine/types'

const DEFAULT_CANVAS_WIDTH = 240
const DEFAULT_CANVAS_HEIGHT = 180
const ANIMATION_NAMES = ['idle', 'walk', 'run', 'sleep', 'jump', 'roll', 'attack'] as const
const PET_DIRECTIONS = ['left', 'right'] as const
const FREE_PET_POSITIONS = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const
const FLOOR_PET_POSITIONS = ['left', 'center', 'right'] as const

export type DesktopPetCanvasSize = {
  width: number
  height: number
  isFullscreen: boolean
}

export function readCanvasSize(element: HTMLElement): DesktopPetCanvasSize {
  const hasCustomWidth = element.hasAttribute('width')
  const hasCustomHeight = element.hasAttribute('height')
  const isFullscreen = !hasCustomWidth && !hasCustomHeight

  // 沒有指定 width/height 就走桌面寵物的預設模式：全螢幕透明 overlay
  return {
    width: isFullscreen
      ? window.innerWidth
      : readNumberAttribute(element, 'width', DEFAULT_CANVAS_WIDTH, { min: 1 }),
    height: isFullscreen
      ? window.innerHeight
      : readNumberAttribute(element, 'height', DEFAULT_CANVAS_HEIGHT, { min: 1 }),
    isFullscreen,
  }
}

export function readPosition(
  element: HTMLElement,
  hasFloor: boolean,
): FreePetPosition | FloorPetPosition {
  if (hasFloor) {
    // 有 floor 時 position 只控制水平位置，垂直位置交給 floor-offset
    return readStringAttribute(element, 'position', 'center', FLOOR_PET_POSITIONS)
  }

  return readStringAttribute(element, 'position', 'bottom-right', FREE_PET_POSITIONS)
}

export function readDirection(element: HTMLElement): PetDirection {
  return readStringAttribute(element, 'direction', 'right', PET_DIRECTIONS)
}

export function readAnimations(element: HTMLElement, rows: number): AnimationMap {
  const maxRow = Math.max(rows - 1, 0)
  // 先支援最常用的 idle/walk row override，完整 animation map 留給 JS API
  const idleRow = readNumberAttribute(element, 'idle-row', defaultAnimations.idle.row, {
    min: 0,
    max: maxRow,
  })
  const walkRow = readNumberAttribute(element, 'walk-row', defaultAnimations.walk.row, {
    min: 0,
    max: maxRow,
  })

  return {
    ...defaultAnimations,
    idle: {
      ...defaultAnimations.idle,
      row: idleRow,
    },
    walk: {
      ...defaultAnimations.walk,
      row: walkRow,
    },
  }
}

export function readMovementSpeed(element: HTMLElement): number {
  return readNumberAttribute(element, 'movement-speed', 1, {
    min: 0.1,
    max: 5,
  })
}

export function readFollowDistance(element: HTMLElement): number {
  return readNumberAttribute(element, 'follow-distance', 24, {
    min: 0,
    max: 512,
  })
}

export function readAnimationAttribute(
  element: HTMLElement,
  name: string,
): AnimationName | null {
  const value = element.getAttribute(name)
  if (value === null) {
    return null
  }

  if (!ANIMATION_NAMES.includes(value as AnimationName)) {
    console.warn(
      `<desktop-pet> attribute "${name}" received unsupported value "${value}". ` +
        `Expected one of: ${ANIMATION_NAMES.join(', ')}.`,
    )
    return null
  }

  return value as AnimationName
}

export function createDesktopPetStyle(): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = `
    :host {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483647;
      line-height: 0;
      background: transparent;
    }

    /*
      指定 width 或 height 就切回 inline 模式，方便放在範例或一般版面裡測試。
    */
    :host([width]),
    :host([height]) {
      position: static;
      inset: auto;
      display: inline-block;
      width: fit-content;
      height: fit-content;
      z-index: auto;
    }

    canvas {
      display: block;
      background: transparent;
    }
  `
  return style
}
