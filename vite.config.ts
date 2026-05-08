import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'WebSpritePet',
      fileName: (format) => (format === 'es' ? 'web-sprite-pet.js' : 'web-sprite-pet.umd.cjs'),
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
    },
  },
});
