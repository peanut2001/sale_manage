import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 开发时 npm run dev (5173), 接口转发给 python app.py (5000)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:5000' },
  },
})
