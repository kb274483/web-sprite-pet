import { defaultAnimations } from "./engine/animations";
import { createPetEngine } from "./engine/petEngine";
import { readNumberAttribute, readStringAttribute } from "./common/attributes";
import { resolvePetAnchor } from "./engine/position";
import type { AnimationMap, PetEngine, FreePetPosition, FloorPetPosition } from "./engine/types";

const DEFAULT_CANVAS_WIDTH = 240
const DEFAULT_CANVAS_HEIGHT = 180
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

export class DesktopPetElement extends HTMLElement {
  private readonly shadow: ShadowRoot
  private readonly canvas: HTMLCanvasElement
  private engine: PetEngine | null = null
  private isHoveringPet = false

  constructor(){
    super()

    this.shadow = this.attachShadow({mode:'open'})
    this.canvas = document.createElement('canvas')
    this.shadow.append(this.createStyle(), this.canvas)
  }

  connectedCallback():void{
    const { width, height } = this.readCanvasSize()
    this.syncResizeListener()
    // 圖片路徑
    const src = this.getAttribute('src') ?? ''
    if(!src) console.warn('<desktop-pet> requires a "src" attribute.')
    // 圖片 Cols & Rows 分別是多少
    const cols = readNumberAttribute(this, 'cols', 6, { min: 1, max: 99 })
    const rows = readNumberAttribute(this, 'rows', 6, { min: 1, max: 99 })
    const animations = this.readAnimations(rows)
    // 圖片縮放比例
    const scale = readNumberAttribute(this, 'scale', 1, { min: 0.1, max: 10 })
    // Sprite 動畫速度
    const animationSpeed = readNumberAttribute(this, 'animation-speed', 1, {
      min: 0.1,
      max: 10,
    })
    const movementSpeed = this.readMovementSpeed()
    // Sprite 方向
    const direction = readStringAttribute(this, 'direction', 'right', PET_DIRECTIONS)
    const anchor = this.resolveCurrentAnchor(width, height)

    this.engine = createPetEngine(this.canvas, {
      pets: [
        {
          id: 'default',
          name: 'Default Pet',
          src,
          x: anchor.x,
          y: anchor.y,
          scale,
          direction
        },
      ],
      spriteSheet: {
        cols,
        rows,
      },
      animations,
      animationSpeed,
      movementSpeed,
      onPetLoad: () => {
        this.updateLayout()
      }
    });

    this.engine.resize(width, height);
    this.syncInteractionListeners()
    this.engine.start();
  }

  disconnectedCallback(): void {
    this.engine?.destroy();
    this.engine = null;
    window.removeEventListener('resize', this.updateLayout)
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('click', this.handleClick)
    this.isHoveringPet = false
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue || !this.isConnected) {
      return
    }

    this.syncResizeListener()
    this.syncInteractionListeners()
    this.syncMovementSpeed()
    this.updateLayout()
  }

  static get observedAttributes() {
    return [
      'position',
      'floor',
      'floor-offset',
      'edge-padding',
      'width',
      'height',
      'interactive',
      'follow-pointer',
      'movement-speed',
    ]
  }

  private updateLayout = (): void => {
    const { width, height } = this.readCanvasSize()
    const anchor = this.resolveCurrentAnchor(width, height)
  
    this.engine?.resize(width, height)
    this.engine?.setPetAnchor('default', anchor.x, anchor.y)
  }

  private syncResizeListener(): void {
    const { isFullscreen } = this.readCanvasSize()

    if (isFullscreen) {
      window.addEventListener('resize', this.updateLayout)
    } else {
      window.removeEventListener('resize', this.updateLayout)
    }
  }

  private syncInteractionListeners(): void {
    const needsPointerMove = this.hasAttribute('interactive') || this.hasAttribute('follow-pointer')

    if (needsPointerMove) {
      window.addEventListener('pointermove', this.handlePointerMove)
    } else {
      window.removeEventListener('pointermove', this.handlePointerMove)
      this.isHoveringPet = false
    }

    if (this.hasAttribute('interactive')) {
      window.addEventListener('click', this.handleClick)
    } else {
      window.removeEventListener('click', this.handleClick)
      this.isHoveringPet = false
    }
  }

  private syncMovementSpeed(): void {
    this.engine?.setMovementSpeed(this.readMovementSpeed())
  }

  private handlePointerMove = (event: PointerEvent): void => {
    this.updateFollowTarget(event)

    if (!this.hasAttribute('interactive')) {
      return
    }

    const detail = this.readPetPointerEventDetail(event)
    if (!detail) {
      if (this.isHoveringPet) {
        this.isHoveringPet = false
        const bounds = this.readViewportPetBounds()
        if (bounds) {
          this.dispatchEvent(new CustomEvent('pet-hover-end', {
            detail: {
              id: 'default',
              pointerX: event.clientX,
              pointerY: event.clientY,
              bounds,
            },
          }))
        }
      }
      return
    }

    if (!this.isHoveringPet) {
      this.isHoveringPet = true
      this.dispatchEvent(new CustomEvent('pet-hover-start', { detail }))
    }
  }

  private updateFollowTarget(event: PointerEvent): void {
    if (!this.hasAttribute('follow-pointer')) {
      return
    }

    const canvasRect = this.canvas.getBoundingClientRect()
    const { height } = this.readCanvasSize()
    const hasFloor = this.hasAttribute('floor')
    const floorOffset = readNumberAttribute(this, 'floor-offset', 24, { min: 0 })
    const targetX = event.clientX - canvasRect.left
    const targetY = hasFloor ? height - floorOffset : event.clientY - canvasRect.top

    this.engine?.setPetTarget('default', targetX, targetY)
  }

  private handleClick = (event: MouseEvent): void => {
    const detail = this.readPetPointerEventDetail(event)
    if (!detail) {
      return
    }

    this.dispatchEvent(new CustomEvent('pet-click', { detail }))
  }

  private readPetPointerEventDetail(event: MouseEvent | PointerEvent): PetPointerEventDetail | null {
    const bounds = this.readViewportPetBounds()
    if (!bounds || !isPointInBounds(event.clientX, event.clientY, bounds)) {
      return null
    }

    return {
      id: 'default',
      pointerX: event.clientX,
      pointerY: event.clientY,
      bounds,
    }
  }

  private readViewportPetBounds(): PetPointerBounds | null {
    const bounds = this.engine?.getPetBounds('default')
    if (!bounds) {
      return null
    }

    const canvasRect = this.canvas.getBoundingClientRect()

    return {
      left: canvasRect.left + bounds.left,
      top: canvasRect.top + bounds.top,
      right: canvasRect.left + bounds.right,
      bottom: canvasRect.top + bounds.bottom,
      width: bounds.width,
      height: bounds.height,
    }
  }

  private resolveCurrentAnchor(width: number, height: number): { x: number; y: number } {
    const hasFloor = this.hasAttribute('floor')
    const floorOffset = readNumberAttribute(this, 'floor-offset', 24, { min: 0 })
    const edgePadding = readNumberAttribute(this, 'edge-padding', 24, { min: 0 })
    const position = this.readPosition(hasFloor)
    const petSize = this.engine?.getPetSize('default')
  
    return resolvePetAnchor({
      position,
      canvasWidth: width,
      canvasHeight: height,
      targetWidth: petSize?.targetWidth ?? 0,
      targetHeight: petSize?.targetHeight ?? 0,
      edgePadding,
      hasFloor,
      floorOffset,
    })
  }

  private readCanvasSize(): { width: number; height: number; isFullscreen: boolean } {
    const hasCustomWidth = this.hasAttribute('width')
    const hasCustomHeight = this.hasAttribute('height')
    const isFullscreen = !hasCustomWidth && !hasCustomHeight

    return {
      width: isFullscreen
        ? window.innerWidth
        : readNumberAttribute(this, 'width', DEFAULT_CANVAS_WIDTH, { min: 1 }),
      height: isFullscreen
        ? window.innerHeight
        : readNumberAttribute(this, 'height', DEFAULT_CANVAS_HEIGHT, { min: 1 }),
      isFullscreen,
    }
  }

  private readPosition(hasFloor: boolean): FreePetPosition | FloorPetPosition{
    if(hasFloor){
      return readStringAttribute(this, 'position', 'center', FLOOR_PET_POSITIONS)
    }
    return readStringAttribute(this, 'position', 'bottom-right', FREE_PET_POSITIONS)
  }

  private readAnimations(rows: number): AnimationMap {
    const maxRow = Math.max(rows - 1, 0)
    const idleRow = readNumberAttribute(this, 'idle-row', defaultAnimations.idle.row, {
      min: 0,
      max: maxRow,
    })
    const walkRow = readNumberAttribute(this, 'walk-row', defaultAnimations.walk.row, {
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

  private readMovementSpeed(): number {
    return readNumberAttribute(this, 'movement-speed', 1, {
      min: 0.1,
      max: 5,
    })
  }

  private createStyle(): HTMLStyleElement {
    const style = document.createElement('style');
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
    `;
    return style;
  }
}

type PetPointerBounds = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

type PetPointerEventDetail = {
  id: string
  pointerX: number
  pointerY: number
  bounds: PetPointerBounds
}

function isPointInBounds(x: number, y: number, bounds: PetPointerBounds): boolean {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
}
