import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
export default defineConfig({ plugins: [vue()], base: './', server: { port: 5173, strictPort: true }, build: { chunkSizeWarningLimit: 850 } })
