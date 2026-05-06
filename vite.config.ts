import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DesktopPet',
      fileName: (format) => (format === 'es' ? 'desktop-pet.js' : 'desktop-pet.umd.cjs'),
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
    },
  },
});
