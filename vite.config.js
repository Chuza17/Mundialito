import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'github' ? '/Mundialito/' : mode === 'docs' ? './' : '/',
  build: {
    outDir: mode === 'docs' ? 'docs' : 'dist',
  },
  plugins: [react()],
}))
