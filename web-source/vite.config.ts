import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  // locales/en.json lives in the resource folder, one level up.
  server: { fs: { allow: ['..'] } },
  build: {
    outDir: '../web',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        phone: fileURLToPath(new URL('./phone.html', import.meta.url)),
      },
    },
  },
});
