import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    viteStaticCopy({
      targets: [{ src: 'src/widget/mw.js', dest: '.' }]
    })
  ],
})