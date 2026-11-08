import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/Ai-Trading-Bot-V1/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})