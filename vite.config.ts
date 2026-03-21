import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@store': resolve(__dirname, 'src/store'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Split large vendor chunks for faster initial load
        codeSplitting: true,
      },
    },
  },
})
