import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- 1. เพิ่มบรรทัดนี้

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 2. เรียกใช้งาน Plugin ตรงนี้
  ],
  server: {
    watch: { usePolling: true },
    host: true,
    strictPort: true,
    port: 5173, 
  }
})
