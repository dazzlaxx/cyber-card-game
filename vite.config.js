import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cyber-card-game/',  
  server: {
    port: 3000,
    open: true
  }
})