import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectRoot = resolve(__dirname)

export default defineConfig({
  root: resolve(projectRoot, 'playground'),
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      allow: [projectRoot],
    },
  },
  build: {
    outDir: resolve(projectRoot, 'dist-playground'),
    emptyOutDir: true,
  },
})
