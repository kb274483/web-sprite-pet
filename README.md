# desktop-sprite-pet

A lightweight, framework-agnostic Web Component for rendering animated desktop pets with canvas and sprite sheets.

The package is designed to work in plain HTML, Vue, Nuxt, React, or any frontend environment that supports native Web Components.

## Features

- Native Web Component
- Canvas rendering
- TypeScript source
- Sprite sheet animation
- Framework-agnostic usage
- No runtime framework dependency

## Installation

```bash
npm install desktop-sprite-pet
```

## Basic Usage

```html
<script type="module">
  import 'desktop-sprite-pet';
</script>

<desktop-pet
  src="/sprites/cat_sprite.png"
  cols="6"
  rows="6"
  scale="0.5"
  animation-speed="1"
></desktop-pet>
```

## Attributes

| Attribute | Default | Description |
| --- | --- | --- |
| `src` | none | Sprite sheet image URL. Required. |
| `cols` | `6` | Number of columns in the sprite sheet. |
| `rows` | `6` | Number of rows in the sprite sheet. |
| `width` | `240` | Canvas width in CSS pixels. |
| `height` | `180` | Canvas height in CSS pixels. |
| `scale` | `1` | Rendered sprite scale multiplier. |
| `animation-speed` | `1` | Animation speed multiplier. `1` is base speed, `2` is faster, `0.5` is slower. |

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
