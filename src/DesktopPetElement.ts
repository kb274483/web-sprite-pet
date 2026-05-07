import { defaultAnimations } from "./engine/animations";
import { createPetEngine } from "./engine/petEngine";
import { readNumberAttribute, readStringAttribute } from "./common/attributes";
import type { PetEngine } from "./engine/types";

const DEFAULT_CANVAS_WIDTH = 240
const DEFAULT_CANVAS_HEIGHT = 180
const PET_DIRECTIONS = ['left', 'right'] as const

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
    // 圖片路徑
    const src = this.getAttribute('src') ?? ''
    if(!src) console.warn('<desktop-pet> requires a "src" attribute.')
    // Canvas 寬 ＆ 高
    const width = readNumberAttribute(this, 'width', DEFAULT_CANVAS_WIDTH, { min: 1 })
    const height = readNumberAttribute(this, 'height', DEFAULT_CANVAS_HEIGHT, { min: 1 })
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

    this.engine = createPetEngine(this.canvas, {
      pets: [
        {
          id: 'default',
          name: 'Default Pet',
          src,
          x: width / 2,
          y: height / 2,
          scale,
          direction
        },
      ],
      spriteSheet: {
        cols,
        rows,
      },
      animations: defaultAnimations,
      animationSpeed
    });

    this.engine.resize(width, height);
    this.engine.start();
  }

  disconnectedCallback(): void {
    this.engine?.destroy();
    this.engine = null;
  }

  private createStyle(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-block;
        width: fit-content;
        height: fit-content;
        line-height: 0;
      }

      canvas {
        display: block;
      }
    `;
    return style;
  }
}