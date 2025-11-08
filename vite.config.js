import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base path for custom domain deployment
  // Repository is served at https://babelpod.markgravestock.com
  base: '/',
})
