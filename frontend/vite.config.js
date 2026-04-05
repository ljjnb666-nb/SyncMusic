import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import history from 'connect-history-api-fallback'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    setupMiddlewares: (middlewares) => {
      middlewares.push(history())
      return middlewares
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        ws: true,
        changeOrigin: true
      },
      '/downloads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      },
      '/local-music': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
})
