import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ ensures relative paths for JS/CSS
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: "dist", // ✅ ensures Vercel knows where to find build output
  },
})
