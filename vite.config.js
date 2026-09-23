import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base keeps the built site portable: it works on Vercel, on GitHub
  // Pages under a sub-path, or from a plain folder copied to another PC.
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 4000, open: false, strictPort: true },
  preview: { port: 4000, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
})
