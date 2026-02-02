import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'electron',
        'electron-store',
        'axios',
        'uuid',
        'path',
        'fs',
      ],
    },
  },
});
