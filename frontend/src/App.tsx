// ═══════════════════════════════════════════════════════════════════════════════
// App.tsx — Componente raíz de la aplicación
//
// Configura los "providers" de la aplicación:
//   - QueryClientProvider: provee el cache global de React Query a toda la app.
//
// Un "Provider" en React es un componente que pone datos o servicios
// disponibles para todos sus componentes hijo — sin pasarlos por props.
// Analogía: es como el "directorio" de una empresa — todos los empleados
// (componentes) pueden consultar los recursos (cache) sin que se los pasen uno a uno.
// ═══════════════════════════════════════════════════════════════════════════════

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// QueryClient     = el cache de React Query. Almacena resultados de queries.
// QueryClientProvider = componente React que provee el cache a toda la app.

import { TareasPage } from '@/presentation/pages/TareasPage'

// ─────────────────────────────────────────────────────────────────────────────
// Configuración del QueryClient
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  // "new QueryClient()" = instancia el cache. Solo uno por aplicación.
  // Creamos la instancia FUERA del componente App para que no se recree
  // en cada render (si estuviera dentro, se perdería el cache al re-render).

  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // staleTime = tiempo en milisegundos que los datos se consideran "frescos".
      // 30_000 = 30 segundos. "30_000" es igual a "30000" — el "_" es solo legibilidad.
      // Si el componente pide datos que tienen menos de 30s → devuelve cache sin fetch.
      // Si tienen más de 30s → hace un nuevo fetch en background.

      retry: 1,
      // "retry" = cuántas veces reintenta si el queryFn falla.
      // 1 = reintenta una vez antes de marcar como error.
    },
  },
})


// ─────────────────────────────────────────────────────────────────────────────
// Componente App
// ─────────────────────────────────────────────────────────────────────────────

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/*
        QueryClientProvider "envuelve" toda la app.
        Cualquier componente dentro puede llamar useQuery/useMutation
        y accederá al mismo "queryClient" (cache compartido).

        Sin este Provider, los hooks de React Query no funcionan.
        Es el equivalente a conectar el cable de luz — sin él, no hay energía.
      */}
      <TareasPage />
      {/* La única página de esta app. Para una app con múltiples páginas,
          aquí iría React Router con las rutas. */}
    </QueryClientProvider>
  )
}
