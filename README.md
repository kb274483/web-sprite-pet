# web-sprite-pet 中文文件

`web-sprite-pet` 是一個輕量、與框架無關的 Web Component，用 canvas 和 sprite sheet 繪製網頁 sprite 寵物。

它可以用在純 HTML、Vue、Nuxt、React，或任何支援原生 Web Components 的前端環境。

## 功能

- 原生 Web Component
- Canvas 繪製
- TypeScript 原始碼
- Sprite sheet 動畫
- 跟隨滑鼠
- Hover / click 互動
- 不綁定任何前端框架
- 無 runtime framework dependency

## 安裝

```bash
npm install web-sprite-pet
```

## 基本使用

```html
<script type="module">
  import 'web-sprite-pet'
</script>

<web-sprite-pet
  src="/sprites/cat_sprite.png"
  cols="6"
  rows="6"
  scale="0.5"
  animation-speed="1"
></web-sprite-pet>
```

## 互動使用

```html
<web-sprite-pet
  src="/sprites/cat_sprite.png"
  cols="6"
  rows="6"
  scale="0.5"
  position="bottom-right"
  interactive
  follow-pointer
  follow-distance="32"
  movement-speed="1"
  hover-animation="sleep"
  click-animation="roll"
></web-sprite-pet>
```

## 使用 JavaScript 自訂動畫

如果需要完整自訂 animation map，可以設定 `animations` JavaScript property：

```html
<web-sprite-pet
  id="pet"
  src="/sprites/cat_sprite.png"
  cols="8"
  rows="7"
></web-sprite-pet>

<script type="module">
  import 'web-sprite-pet'

  const pet = document.querySelector('#pet')

  pet.animations = {
    idle: { row: 0, frames: 4, frameDuration: 200 },
    walk: { row: 1, frames: 8, frameDuration: 120 },
    run: { row: 2, frames: 8, frameDuration: 80 },
    sleep: { row: 3, frames: 6, frameDuration: 300 },
    jump: { row: 4, frames: 6, frameDuration: 140 },
    roll: { row: 5, frames: 6, frameDuration: 120 },
    attack: { row: 6, frames: 6, frameDuration: 100 },
  }
</script>
```

如果在元素 connected 之後設定 `animations`，內部 engine 會使用新的 animation map 重新建立。

`animations` 必須包含所有支援的動畫名稱：

```ts
type AnimationName =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sleep'
  | 'jump'
  | 'roll'
  | 'attack'

type AnimationMap = Record<AnimationName, {
  row: number
  frames: number
  frameDuration: number
}>
```

欄位說明：

| 欄位 | 說明 |
| --- | --- |
| `row` | 動畫在 sprite sheet 中的列，從 `0` 開始。 |
| `frames` | 這個動畫要播放幾格 frame。 |
| `frameDuration` | 每一格停留多久，單位是毫秒。 |

`frames` 可以每個 row 不一樣，這是支援的。需要注意的是，`frames` 不能超過該 row 實際可用的格數；如果 sprite sheet 設定 `cols="8"`，某個動畫的 `frames` 就應該是 `1` 到 `8`。如果設定超過實際格數，canvas 會裁到該列以外的區域，可能出現錯位、空白或下一列的圖。

## 屬性

| 屬性 | 預設值 | 支援即時更新 | 說明 |
| --- | --- | --- | --- |
| `src` | 無 | 否 | Sprite sheet 圖片路徑。必填。 |
| `cols` | `6` | 否 | Sprite sheet 的欄數。 |
| `rows` | `6` | 否 | Sprite sheet 的列數。 |
| `width` | `240` | 否 | inline 模式下的 canvas 寬度，單位為 CSS px。 |
| `height` | `180` | 否 | inline 模式下的 canvas 高度，單位為 CSS px。 |
| `scale` | `1` | 否 | 寵物繪製縮放倍率。 |
| `animation-speed` | `1` | 否 | 動畫播放速度倍率。`1` 是基準速度，`2` 較快，`0.5` 較慢。 |
| `direction` | `right` | 否 | 初始面向。支援 `left`、`right`。 |
| `idle-row` | `0` | 否 | `idle` 動畫使用的 sprite sheet row。 |
| `walk-row` | `1` | 否 | `walk` 動畫使用的 sprite sheet row。 |
| `position` | `bottom-right`，有 `floor` 時為 `center` | 是 | 寵物目前/初始 anchor 位置。 |
| `floor` | 關閉 | 是 | 將寵物鎖定在地板線上；啟用後 `position` 只控制水平位置。 |
| `floor-offset` | `24` | 否 | 地板線距離 canvas 底部的距離。 |
| `edge-padding` | `24` | 否 | 根據 `position` 計算位置時，寵物與 canvas 邊緣的距離。 |
| `movement-speed` | `1` | 是 | 跟隨滑鼠時的移動速度倍率。 |
| `follow-pointer` | 關閉 | 否 | 讓寵物朝滑鼠位置移動。 |
| `follow-distance` | `32` | 是 | 跟隨滑鼠時，寵物 anchor 與滑鼠之間保留的距離，單位為 CSS px。 |
| `interactive` | 關閉 | 否 | 啟用 hover 與 click hit test。 |
| `hover-animation` | 無 | 是 | 滑鼠停在寵物上時持續播放的動畫。 |
| `click-animation` | 無 | 否 | 點擊寵物時播放一次的動畫。 |

目前文件承諾支援即時更新的屬性只有：

```txt
position
floor
movement-speed
follow-distance
hover-animation
```

其他屬性會在元件初始化時讀取。如果需要變更其他屬性，請重新建立 `<web-sprite-pet>` 元素。

## 位置設定

沒有 `floor` 時，`position` 支援九宮格位置：

```txt
top-left
top
top-right
left
center
right
bottom-left
bottom
bottom-right
```

啟用 `floor` 後，`position` 只控制水平位置：

```txt
left
center
right
```

引擎內部會把寵物座標視為 sprite 的底部中心點。這讓地板定位和滑鼠跟隨能跟畫面上的寵物保持一致。

## 跟隨滑鼠

加上 `follow-pointer` 後，寵物會朝滑鼠移動：

```html
<web-sprite-pet src="/sprites/cat_sprite.png" follow-pointer></web-sprite-pet>
```

可以用 `follow-distance` 控制寵物和滑鼠之間的距離：

```html
<web-sprite-pet
  src="/sprites/cat_sprite.png"
  follow-pointer
  follow-distance="48"
></web-sprite-pet>
```

如果同時啟用 `interactive`，當滑鼠已經在寵物 bounds 內時，follow target 會暫停更新。這可以避免寵物在 hover 或 click 觸發前一直往外移動。

## 事件

加上 `interactive` 後，可以監聽互動事件：

```html
<web-sprite-pet
  id="pet"
  src="/sprites/cat_sprite.png"
  interactive
  hover-animation="sleep"
  click-animation="roll"
></web-sprite-pet>

<script>
  const pet = document.querySelector('#pet')

  pet.addEventListener('pet-hover-start', (event) => {
    console.log(event.detail)
  })

  pet.addEventListener('pet-hover-end', (event) => {
    console.log(event.detail)
  })

  pet.addEventListener('pet-click', (event) => {
    console.log(event.detail)
  })
</script>
```

事件 detail 格式：

```ts
type PetPointerEventDetail = {
  id: string
  pointerX: number
  pointerY: number
  bounds: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
}
```

## Sprite Sheet 格式

預設 animation map 會把每一列視為一種動畫：

| Row | Animation |
| --- | --- |
| `0` | `idle` |
| `1` | `walk` / `run` |
| `2` | `sleep` |
| `3` | `jump` |
| `4` | `roll` |
| `5` | `attack` |

每一格 frame 的尺寸會由圖片大小與 grid 自動推算：

```txt
frameWidth = image.width / cols
frameHeight = image.height / rows
```

Sprite sheet 必須使用固定 grid：

- 每一格 frame 都必須有相同的寬度與高度。
- 每一列都會用同一個 `frameWidth` 切圖，不支援某些動畫 frame 比較寬或被拉伸。
- 短動畫可以少於 `cols` 格，但有效 frame 必須從該列第 0 格開始連續排列。
- 目前不支援有效 frame 置中排列，例如 `[空][空][1][2][3][4][空][空]`。
- 如果某列只有 4 格動畫，建議排成 `[1][2][3][4][空][空][空][空]`，並設定 `frames: 4`。

## 本機開發

```bash
npm install
npm run dev
```

HTML 範例位於 `/examples/html/`。

## 建置

```bash
npm run typecheck
npm run build
```

建置結果會輸出 ESM、UMD 和 TypeScript declarations 到 `dist/`。

# web-sprite-pet

A lightweight, framework-agnostic Web Component for rendering animated web sprite pets with canvas and sprite sheets.

The package works in plain HTML, Vue, Nuxt, React, or any frontend environment that supports native Web Components.

## Features

- Native Web Component
- Canvas rendering
- TypeScript source
- Sprite sheet animation
- Pointer following
- Hover and click interactions
- Framework-agnostic usage
- No runtime framework dependency

## Installation

```bash
npm install web-sprite-pet
```

## Basic Usage

```html
<script type="module">
  import 'web-sprite-pet'
</script>

<web-sprite-pet
  src="/sprites/cat_sprite.png"
  cols="6"
  rows="6"
  scale="0.5"
  animation-speed="1"
></web-sprite-pet>
```

## Interactive Usage

```html
<web-sprite-pet
  src="/sprites/cat_sprite.png"
  cols="6"
  rows="6"
  scale="0.5"
  position="bottom-right"
  interactive
  follow-pointer
  follow-distance="32"
  movement-speed="1"
  hover-animation="sleep"
  click-animation="roll"
></web-sprite-pet>
```

## Custom Animations With JavaScript

For full animation map customization, set the `animations` JavaScript property:

```html
<web-sprite-pet
  id="pet"
  src="/sprites/cat_sprite.png"
  cols="8"
  rows="7"
></web-sprite-pet>

<script type="module">
  import 'web-sprite-pet'

  const pet = document.querySelector('#pet')

  pet.animations = {
    idle: { row: 0, frames: 4, frameDuration: 200 },
    walk: { row: 1, frames: 8, frameDuration: 120 },
    run: { row: 2, frames: 8, frameDuration: 80 },
    sleep: { row: 3, frames: 6, frameDuration: 300 },
    jump: { row: 4, frames: 6, frameDuration: 140 },
    roll: { row: 5, frames: 6, frameDuration: 120 },
    attack: { row: 6, frames: 6, frameDuration: 100 },
  }
</script>
```

Setting `animations` after the element is connected rebuilds the internal engine with the new animation map.

`animations` must include every supported animation name:

```ts
type AnimationName =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sleep'
  | 'jump'
  | 'roll'
  | 'attack'

type AnimationMap = Record<AnimationName, {
  row: number
  frames: number
  frameDuration: number
}>
```

Field meaning:

| Field | Description |
| --- | --- |
| `row` | The sprite sheet row for this animation. Rows start at `0`. |
| `frames` | Number of frames to play for this animation. |
| `frameDuration` | Duration of each frame in milliseconds. |

Different rows can use different `frames` values. That is supported. The important constraint is that `frames` must not exceed the number of available cells in that row. If the sprite sheet uses `cols="8"`, each animation should use `1` to `8` frames. If `frames` is larger than the available cells, canvas may sample outside that row and render misaligned frames, blank space, or images from the next row.

## Attributes

| Attribute | Default | Dynamic update | Description |
| --- | --- | --- | --- |
| `src` | none | No | Sprite sheet image URL. Required. |
| `cols` | `6` | No | Number of columns in the sprite sheet. |
| `rows` | `6` | No | Number of rows in the sprite sheet. |
| `width` | `240` | No | Canvas width in CSS pixels when using inline mode. |
| `height` | `180` | No | Canvas height in CSS pixels when using inline mode. |
| `scale` | `1` | No | Rendered sprite scale multiplier. |
| `animation-speed` | `1` | No | Animation speed multiplier. `1` is base speed, `2` is faster, `0.5` is slower. |
| `direction` | `right` | No | Initial sprite direction. Supported values: `left`, `right`. |
| `idle-row` | `0` | No | Sprite sheet row used for the `idle` animation. |
| `walk-row` | `1` | No | Sprite sheet row used for the `walk` animation. |
| `position` | `bottom-right`, or `center` with `floor` | Yes | Initial/current pet anchor position. |
| `floor` | off | Yes | Locks the pet to a floor line. With `floor`, `position` only controls horizontal placement. |
| `floor-offset` | `24` | No | Distance from the bottom of the canvas to the floor line. |
| `edge-padding` | `24` | No | Padding between the pet and the canvas edge when resolving `position`. |
| `movement-speed` | `1` | Yes | Follow movement speed multiplier. |
| `follow-pointer` | off | No | Moves the pet toward the pointer. |
| `follow-distance` | `32` | Yes | Distance in CSS pixels to keep between the pet anchor and pointer while following. |
| `interactive` | off | No | Enables hover and click hit testing. |
| `hover-animation` | none | Yes | Animation to hold while the pointer is over the pet. |
| `click-animation` | none | No | Animation to play once when the pet is clicked. |

Only the attributes marked **Dynamic update: Yes** are part of the supported runtime update contract:

```txt
position
floor
movement-speed
follow-distance
hover-animation
```

Other attributes are read during component initialization. If you need to change them, recreate the `<web-sprite-pet>` element.

## Positioning

Without `floor`, `position` supports a nine-point layout:

```txt
top-left
top
top-right
left
center
right
bottom-left
bottom
bottom-right
```

With `floor`, `position` only controls horizontal placement:

```txt
left
center
right
```

The engine treats the pet coordinate as the bottom-center anchor of the sprite. This keeps floor placement and pointer following consistent with the visible pet.

## Pointer Following

Add `follow-pointer` to move the pet toward the pointer:

```html
<web-sprite-pet src="/sprites/cat_sprite.png" follow-pointer></web-sprite-pet>
```

Use `follow-distance` to keep space between the pet and the pointer:

```html
<web-sprite-pet
  src="/sprites/cat_sprite.png"
  follow-pointer
  follow-distance="48"
></web-sprite-pet>
```

When `interactive` is also enabled, pointer following pauses while the pointer is already over the pet. This prevents the pet from continuously moving away before hover or click can be triggered.

## Events

Enable `interactive` to receive pointer events:

```html
<web-sprite-pet
  id="pet"
  src="/sprites/cat_sprite.png"
  interactive
  hover-animation="sleep"
  click-animation="roll"
></web-sprite-pet>

<script>
  const pet = document.querySelector('#pet')

  pet.addEventListener('pet-hover-start', (event) => {
    console.log(event.detail)
  })

  pet.addEventListener('pet-hover-end', (event) => {
    console.log(event.detail)
  })

  pet.addEventListener('pet-click', (event) => {
    console.log(event.detail)
  })
</script>
```

Event detail shape:

```ts
type PetPointerEventDetail = {
  id: string
  pointerX: number
  pointerY: number
  bounds: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
}
```

## Sprite Sheet Format

The default animation map expects each row to represent one animation:

| Row | Animation |
| --- | --- |
| `0` | `idle` |
| `1` | `walk` / `run` |
| `2` | `sleep` |
| `3` | `jump` |
| `4` | `roll` |
| `5` | `attack` |

Frame size is derived from the image size and grid:

```txt
frameWidth = image.width / cols
frameHeight = image.height / rows
```

Sprite sheets must use a fixed grid:

- Every frame cell must have the same width and height.
- Every row is sliced with the same `frameWidth`; stretched or wider animation frames are not supported.
- Short animations can use fewer than `cols` frames, but valid frames must start at cell `0` and be contiguous.
- Centered frame layouts such as `[empty][empty][1][2][3][4][empty][empty]` are not currently supported.
- If a row has only 4 valid animation frames, use `[1][2][3][4][empty][empty][empty][empty]` and set `frames: 4`.

## Local Development

```bash
npm install
npm run dev
```

Open the HTML example at `/examples/html/`.

## Build

```bash
npm run typecheck
npm run build
```

The library build outputs ESM, UMD, and TypeScript declarations to `dist/`.

---
