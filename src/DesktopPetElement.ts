import { defaultAnimations } from "./engine/animations";
import { createPetEngine } from "./engine/petEngine";
import { readNumberAttribute, readStringAttribute } from "./common/attributes";
import { resolvePetAnchor } from "./engine/position";
import type { PetEngine, FreePetPosition, FloorPetPosition } from "./engine/types";

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

  constructor(){
    super()

    this.shadow = this.attachShadow({mode:'open'})
    this.canvas = document.createElement('canvas')
    this.shadow.append(this.createStyle(), this.canvas)
  }

  connectedCallback():void{
    const { width, height, isFullscreen } = this.readCanvasSize()
    if (isFullscreen) {
      window.addEventListener('resize', this.updateLayout)
    }
    // 圖片路徑
    const src = this.getAttribute('src') ?? ''
    if(!src) console.warn('<desktop-pet> requires a "src" attribute.')
    // 圖片 Cols & Rows 分別是多少
    const cols = readNumberAttribute(this, 'cols', 6, { min: 1, max: 99 })
    const rows = readNumberAttribute(this, 'rows', 6, { min: 1, max: 99 })
    // 圖片縮放比例
    const scale = readNumberAttribute(this, 'scale', 1, { min: 0.1, max: 10 })
    // Sprite 動畫速度
    const animationSpeed = readNumberAttribute(this, 'animation-speed', 1, {
      min: 0.1,
      max: 10,
    })
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
      animations: defaultAnimations,
      animationSpeed,
      onPetLoad: () => {
        this.updateLayout()
      }
    });

    this.engine.resize(width, height);
    this.engine.start();
  }

  disconnectedCallback(): void {
    this.engine?.destroy();
    this.engine = null;
    window.removeEventListener('resize', this.updateLayout)
  }

  private updateLayout = (): void => {
    const { width, height } = this.readCanvasSize()
    const anchor = this.resolveCurrentAnchor(width, height)
  
    this.engine?.resize(width, height)
    this.engine?.setPetAnchor('default', anchor.x, anchor.y)
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
