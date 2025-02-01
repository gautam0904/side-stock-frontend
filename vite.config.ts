import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'lodash': 'lodash-es',
      '@': path.resolve(__dirname, 'src'),
    }
  }
})
