import { defaultAnimations } from "./engine/animations";
import { createPetEngine } from "./engine/petEngine";
import type { PetEngine } from "./engine/types";

const DEFAULT_CANVAS_WIDTH = 240
const DEFAULT_CANVAS_HEIGHT = 180

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
    // Canvas 寬 ＆ 高
    const width = Number(this.getAttribute('width') || DEFAULT_CANVAS_WIDTH)
    const height = Number(this.getAttribute('height') || DEFAULT_CANVAS_HEIGHT)
    // 圖片路徑
    const src = this.getAttribute('src') || ''
    // 圖片 Cols & Rows 分別是多少
    const cols = Number(this.getAttribute('cols')) || 6
    const rows = Number(this.getAttribute('rows')) || 6
    // 圖片縮放比例
    const scale = Number(this.getAttribute('scale')) || 1
    // Sprite 動畫速度
    const animationSpeed = Number(this.getAttribute('animation-speed')) || 1

    this.engine = createPetEngine(this.canvas, {
      pets: [
        {
          id: 'default',
          name: 'Default Pet',
          src,
          x: width / 2,
          y: height / 2,
          scale
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