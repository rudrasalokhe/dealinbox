import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/auth': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/enquiries/export': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    }
  },
  build: {
    outDir: '../static/dist',
    emptyOutDir: true,
  }
})
