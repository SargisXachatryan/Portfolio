import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/Portfolio/',
  server: {
    port: 5173,         // Fixes Vite to a predictable port
    strictPort: true,   // Prevents Vite from switching ports if 5173 is busy
    hmr: {
      host: 'localhost',// Forces the phone to look at localhost for updates [1]
      port: 5173,       // Routes updates through the same port [1]
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
})
