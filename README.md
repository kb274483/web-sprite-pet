# desktop-sprite-pet

A lightweight, framework-agnostic Web Component for canvas-rendered desktop pet sprite animations.

This package is in early development. Phase 1 provides the Vite + TypeScript library scaffold and a minimal `<desktop-pet>` element that mounts a canvas.

## Development

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

## Basic Usage

```html
<script type="module">
  import 'desktop-sprite-pet';
</script>

<desktop-pet></desktop-pet>
```

## Current Status

- Native Web Component
- Canvas rendering
- TypeScript source
- Vite library build
- HTML example

Sprite sheet animation, configuration parsing, events, and interaction behavior will be added in later phases.
