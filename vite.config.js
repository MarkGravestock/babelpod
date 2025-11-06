import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  // Repository will be served at https://{username}.github.io/babelpod/
  base: process.env.NODE_ENV === 'production' ? '/babelpod/' : '/',
})
