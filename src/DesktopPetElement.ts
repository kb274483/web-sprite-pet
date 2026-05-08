import { defaultAnimations } from "./engine/animations";
import { createPetEngine } from "./engine/petEngine";
import { readNumberAttribute, readStringAttribute } from "./common/attributes";
import { resolvePetAnchor } from "./engine/position";
import type { 
  AnimationName,
  AnimationMap, 
  PetEngine, 
  FreePetPosition, 
  FloorPetPosition, 
  PetPointerEventDetail, 
  PetPointerBounds 
} from "./engine/types";

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

    // Sprite 圖片路徑是必要的，沒有的話 engine 會載不到圖
    const src = this.getAttribute('src') ?? ''
    if(!src) console.warn('<desktop-pet> requires a "src" attribute.')

    // Sprite sheet 用幾欄幾列切圖，預設先走目前範例的 6x6
    const cols = readNumberAttribute(this, 'cols', 6, { min: 1, max: 99 })
    const rows = readNumberAttribute(this, 'rows', 6, { min: 1, max: 99 })
    const animations = this.readAnimations(rows)

    // 實際畫到 canvas 上的縮放比例
    const scale = readNumberAttribute(this, 'scale', 1, { min: 0.1, max: 10 })

    // Sprite 換幀速度，movement 速度另外處理
    const animationSpeed = readNumberAttribute(this, 'animation-speed', 1, {
      min: 0.1,
      max: 10,
    })
    const movementSpeed = this.readMovementSpeed()

    // 初始面向，後續 follow-pointer 移動時 engine 可能會自動翻方向
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
        // 圖片載入後才知道真正尺寸，所以要再算一次初始位置
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
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue || !this.isConnected) {
      return
    }

    this.syncResizeListener()
    this.syncInteractionListeners()
    this.syncMovementSpeed()
    if (name === 'hover-animation' && this.isHoveringPet) {
      this.playHoverAnimation()
    }
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
      'hover-animation',
      'click-animation',
    ]
  }

  private updateLayout = (): void => {
    const { width, height } = this.readCanvasSize()
    const anchor = this.resolveCurrentAnchor(width, height)
  
    // resize 和 anchor 一起更新，避免 viewport 變動後 pet 留在舊座標
    this.engine?.resize(width, height)
    this.engine?.setPetAnchor('default', anchor.x, anchor.y)
  }

  private syncResizeListener(): void {
    const { isFullscreen } = this.readCanvasSize()

    // 只有全螢幕 overlay 需要跟著 window resize；inline 模式用固定尺寸
    if (isFullscreen) {
      window.addEventListener('resize', this.updateLayout)
    } else {
      window.removeEventListener('resize', this.updateLayout)
    }
  }

  private syncInteractionListeners(): void {
    const needsPointerMove = this.hasAttribute('interactive') || this.hasAttribute('follow-pointer')

    // canvas 本身保持 pointer-events: none，所以互動要掛在 window 上做 hit test
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
      this.engine?.clearHeldAnimation('default')
    }
  }

  private syncMovementSpeed(): void {
    this.engine?.setMovementSpeed(this.readMovementSpeed())
  }

  private handlePointerMove = (event: PointerEvent): void => {
    // follow-pointer 和 hover 共用同一個 pointermove，先更新移動目標
    this.updateFollowTarget(event)

    if (!this.hasAttribute('interactive')) {
      return
    }

    const detail = this.readPetPointerEventDetail(event)
    if (!detail) {
      if (this.isHoveringPet) {
        // 離開 pet 時要放掉 hover 動畫，控制權交回 movement 或 idle
        this.isHoveringPet = false
        this.engine?.clearHeldAnimation('default')
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
      // hover-start 只在剛進入 pet 範圍時送一次，避免 pointermove 一直洗事件
      this.isHoveringPet = true
      this.playHoverAnimation()
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
    // 有 floor 的時候只追 x，y 固定踩在地板上
    const targetY = hasFloor ? height - floorOffset : event.clientY - canvasRect.top

    this.engine?.setPetTarget('default', targetX, targetY)
  }

  private handleClick = (event: MouseEvent): void => {
    const detail = this.readPetPointerEventDetail(event)
    if (!detail) {
      return
    }

    // click animation 是一次性的，事件照樣交給外部使用者處理
    this.playClickAnimation()
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

    // engine 回的是 canvas 內座標，事件 detail 要轉成 viewport 座標
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
  
    // 圖片還沒載入前尺寸未知，先用 0 讓 pet 可以初始化；載入後會再 updateLayout
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

    // 沒有指定 width/height 就走桌面寵物的預設模式：全螢幕透明 overlay
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
      // 有 floor 時 position 只控制水平位置，垂直位置交給 floor-offset
      return readStringAttribute(this, 'position', 'center', FLOOR_PET_POSITIONS)
    }
    return readStringAttribute(this, 'position', 'bottom-right', FREE_PET_POSITIONS)
  }

  private readAnimations(rows: number): AnimationMap {
    const maxRow = Math.max(rows - 1, 0)
    // 先支援最常用的 idle/walk row override，完整 animation map 留給 JS API
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

  private playHoverAnimation(): void {
    const animation = this.readAnimationAttribute('hover-animation')
    if (!animation) {
      // hover-animation 沒設定時，hover 不應該卡住目前動畫
      this.engine?.clearHeldAnimation('default')
      return
    }

    this.engine?.playAnimation('default', animation, { mode: 'hold' })
  }

  private playClickAnimation(): void {
    const animation = this.readAnimationAttribute('click-animation')
    if (!animation) {
      return
    }

    this.engine?.playAnimation('default', animation, { mode: 'once' })
  }

  private readAnimationAttribute(name: string): AnimationName | null {
    const value = this.getAttribute(name)
    if (value === null) {
      return null
    }

    if (!ANIMATION_NAMES.includes(value as AnimationName)) {
      console.warn(
        `<desktop-pet> attribute "${name}" received unsupported value "${value}". ` +
        `Expected one of: ${ANIMATION_NAMES.join(', ')}.`
      )
      return null
    }

    return value as AnimationName
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
    `;
    return style;
  }
}



function isPointInBounds(x: number, y: number, bounds: PetPointerBounds): boolean {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
}
