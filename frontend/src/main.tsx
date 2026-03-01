// ═══════════════════════════════════════════════════════════════════════════════
// main.tsx — Punto de entrada de la aplicación React
//
// Este es el PRIMER archivo que ejecuta Vite al iniciar la app.
// Su única responsabilidad: montar React en el DOM.
//
// Flujo de ejecución:
//   1. Browser carga index.html → encuentra <div id="root"> y <script src="/src/main.tsx">
//   2. Vite sirve main.tsx (compilado a JS)
//   3. React monta el componente <App /> dentro del div#root
//   4. El usuario ve la UI
// ═══════════════════════════════════════════════════════════════════════════════

import { StrictMode } from 'react'
// StrictMode = herramienta de desarrollo de React.
// En desarrollo, ejecuta los efectos DOS veces para detectar problemas.
// En producción (build), StrictMode es ignorado — no afecta al usuario.

import { createRoot } from 'react-dom/client'
// "createRoot" = la API moderna de React para montar la app en el DOM.
// Requiere React 18+. La API antigua (ReactDOM.render) está deprecada.

import './index.css'
// Importamos el CSS global. Aquí Tailwind inyecta sus estilos base.
// Sin esta línea, Tailwind no funcionaría.

import { App } from './App'
// El componente raíz de la aplicación.


createRoot(document.getElementById('root')!)
// "document.getElementById('root')" = busca el <div id="root"> en index.html.
// "!" al final = Non-null assertion de TypeScript.
//   Significa: "le aseguro al compilador que este elemento SÍ existe".
//   Sin "!", TypeScript se queja: "puede ser null" (si el div no existe).
//   Como sabemos que index.html tiene el div, usamos "!" para silenciar el warning.
//   Es una de las pocas veces que "!" tiene este significado especial en TypeScript.

.render(
  <StrictMode>
    {/* StrictMode no renderiza ningún elemento visual en la UI.
        Es invisible para el usuario — solo activa verificaciones de desarrollo. */}
    <App />
    {/* Montamos la app completa dentro de StrictMode. */}
  </StrictMode>,
)
// ".render(<JSX />)" inserta el JSX compilado dentro del div#root.
// A partir de este momento, React controla todo lo que pasa dentro del div.
