// PostCSS procesa el CSS de Tailwind y lo transforma en CSS estándar.
// Es un paso intermedio necesario para que Tailwind funcione con Vite.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // autoprefixer agrega prefijos de vendors (-webkit-, -moz-, etc.)
    // para compatibilidad con distintos browsers.
  },
}
