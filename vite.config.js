import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ['*'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
