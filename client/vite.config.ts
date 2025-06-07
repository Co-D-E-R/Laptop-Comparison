import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://laptop-comparison-service-cc8247f480f3.herokuapp.com/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
