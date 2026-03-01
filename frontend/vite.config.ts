// vite.config.ts — Configuración de Vite
// Vite es el "bundler" (empaquetador) que convierte TypeScript + React + JSX
// a JavaScript puro que el browser puede ejecutar.
// Durante desarrollo, también provee un servidor en localhost:5173.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// "path" es un módulo de Node.js para trabajar con rutas de archivos.

export default defineConfig({
  plugins: [react()],
  // El plugin de React activa la transformación de JSX y Fast Refresh
  // (recarga automática sin perder el estado al guardar un archivo).

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Este alias permite escribir "@/domain/entities/Tarea" en lugar de
      // "../../../../../../domain/entities/Tarea". Mucho más legible.
      // TypeScript también lo conoce (configurado en tsconfig.json).
    },
  },

  server: {
    port: 5173,
    // Puerto del servidor de desarrollo. http://localhost:5173
  },
})
