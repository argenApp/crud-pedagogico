/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Tailwind escanea estos archivos para encontrar las clases que usás.
    // Solo incluye en el bundle final las clases que realmente aparecen en el código.
    // Esto minimiza el CSS generado.
  ],
  theme: {
    extend: {},
    // "extend" permite agregar colores, fuentes, etc. personalizados.
    // Lo dejamos vacío para usar solo el tema base de Tailwind.
  },
  plugins: [],
}
