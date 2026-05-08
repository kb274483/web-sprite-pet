import { createPetEngine } from "./engine/petEngine";
import { readNumberAttribute } from "./common/attributes";
import {
  createDesktopPetStyle,
  readAnimationAttribute,
  readAnimations,
  readCanvasSize,
  readDirection,
  readFollowDistance,
  readMovementSpeed,
  readPosition,
} from "./DesktopPetElement.config";
import { resolvePetAnchor } from "./engine/position";
import type { 
  PetEngine, 
  PetPointerEventDetail, 
  PetPointerBounds 
} from "./engine/types";

const DEFAULT_PET_ID = 'default'

export class DesktopPetElement extends HTMLElement {
  private readonly shadow: ShadowRoot
  private readonly canvas: HTMLCanvasElement
  private engine: PetEngine | null = null
  private isHoveringPet = false

  constructor(){
    super()

    this.shadow = this.attachShadow({mode:'open'})
    this.canvas = document.createElement('canvas')
    this.shadow.append(createDesktopPetStyle(), this.canvas)
  }

  connectedCallback():void{
    const { width, height } = readCanvasSize(this)
    this.syncResizeListener()

    // Sprite 圖片路徑是必要的，沒有的話 engine 會載不到圖
    const src = this.getAttribute('src') ?? ''
    if(!src) console.warn('<desktop-pet> requires a "src" attribute.')

    // Sprite sheet 用幾欄幾列切圖，預設先走目前範例的 6x6
    const cols = readNumberAttribute(this, 'cols', 6, { min: 1, max: 99 })
    const rows = readNumberAttribute(this, 'rows', 6, { min: 1, max: 99 })
    const animations = readAnimations(this, rows)

    // 實際畫到 canvas 上的縮放比例
    const scale = readNumberAttribute(this, 'scale', 1, { min: 0.1, max: 10 })

    // Sprite 換幀速度，movement 速度另外處理
    const animationSpeed = readNumberAttribute(this, 'animation-speed', 1, {
      min: 0.1,
      max: 10,
    })
    const movementSpeed = readMovementSpeed(this)

    // 初始面向，後續 follow-pointer 移動時 engine 可能會自動翻方向
    const direction = readDirection(this)
    const anchor = this.resolveCurrentAnchor(width, height)

    this.engine = createPetEngine(this.canvas, {
      pets: [
        {
          id: DEFAULT_PET_ID,
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
    const { width, height } = readCanvasSize(this)
    const anchor = this.resolveCurrentAnchor(width, height)
  
    // resize 和 anchor 一起更新，避免 viewport 變動後 pet 留在舊座標
    this.engine?.resize(width, height)
    this.engine?.setPetAnchor(DEFAULT_PET_ID, anchor.x, anchor.y)
  }

  private syncResizeListener(): void {
    const { isFullscreen } = readCanvasSize(this)

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
      this.engine?.clearHeldAnimation(DEFAULT_PET_ID)
    }
  }

  private syncMovementSpeed(): void {
    this.engine?.setMovementSpeed(readMovementSpeed(this))
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
        this.engine?.clearHeldAnimation(DEFAULT_PET_ID)
        const bounds = this.readViewportPetBounds()
        if (bounds) {
          this.dispatchEvent(new CustomEvent('pet-hover-end', {
            detail: {
              id: DEFAULT_PET_ID,
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
    const { height } = readCanvasSize(this)
    const hasFloor = this.hasAttribute('floor')
    const floorOffset = readNumberAttribute(this, 'floor-offset', 24, { min: 0 })
    const pointerX = event.clientX - canvasRect.left
    // 有 floor 的時候只追 x，y 固定踩在地板上
    const pointerY = hasFloor ? height - floorOffset : event.clientY - canvasRect.top
    const target = this.resolveFollowTarget(event, canvasRect, {
      x: pointerX,
      y: pointerY,
      hasFloor,
    })

    this.engine?.setPetTarget(DEFAULT_PET_ID, target.x, target.y)
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
      id: DEFAULT_PET_ID,
      pointerX: event.clientX,
      pointerY: event.clientY,
      bounds,
    }
  }

  private readViewportPetBounds(): PetPointerBounds | null {
    const bounds = this.engine?.getPetBounds(DEFAULT_PET_ID)
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
    const position = readPosition(this, hasFloor)
    const petSize = this.engine?.getPetSize(DEFAULT_PET_ID)
  
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

  private resolveFollowTarget(
    event: PointerEvent,
    canvasRect: DOMRect,
    pointer: { x: number; y: number; hasFloor: boolean },
  ): { x: number; y: number } {
    const followDistance = readFollowDistance(this)
    if (followDistance <= 0) {
      return { x: pointer.x, y: pointer.y }
    }

    const pointerViewportY = pointer.hasFloor ? canvasRect.top + pointer.y : event.clientY
    const petAnchor = this.readViewportPetAnchor()
    if (!petAnchor) {
      return {
        x: pointer.x - followDistance,
        y: pointer.y,
      }
    }

    const offsetX = petAnchor.x - event.clientX
    const offsetY = pointer.hasFloor ? 0 : petAnchor.y - pointerViewportY
    const distance = Math.hypot(offsetX, offsetY)
    const unitX = distance > 0.001 ? offsetX / distance : -1
    const unitY = distance > 0.001 ? offsetY / distance : 0

    return {
      x: event.clientX + unitX * followDistance - canvasRect.left,
      y: pointer.hasFloor
        ? pointer.y
        : event.clientY + unitY * followDistance - canvasRect.top,
    }
  }

  private readViewportPetAnchor(): { x: number; y: number } | null {
    const bounds = this.readViewportPetBounds()
    if (!bounds) {
      return null
    }

    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.bottom,
    }
  }

  private playHoverAnimation(): void {
    const animation = readAnimationAttribute(this, 'hover-animation')
    if (!animation) {
      // hover-animation 沒設定時，hover 不應該卡住目前動畫
      this.engine?.clearHeldAnimation(DEFAULT_PET_ID)
      return
    }

    this.engine?.playAnimation(DEFAULT_PET_ID, animation, { mode: 'hold' })
  }

  private playClickAnimation(): void {
    const animation = readAnimationAttribute(this, 'click-animation')
    if (!animation) {
      return
    }

    this.engine?.playAnimation(DEFAULT_PET_ID, animation, { mode: 'once' })
  }
}



function isPointInBounds(x: number, y: number, bounds: PetPointerBounds): boolean {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
}
