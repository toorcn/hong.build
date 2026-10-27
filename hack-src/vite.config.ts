import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/hack/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../public/hack',
    emptyOutDir: true,
  },
})
