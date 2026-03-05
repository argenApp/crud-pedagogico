// ═══════════════════════════════════════════════════════════════════════════════
// App.tsx — Componente raíz de la aplicación
//
// Posición en la cadena de dependencias:
//   main.tsx → App → QueryClientProvider → TareasPage → [componentes]
//
// Configura el QueryClient — el cache global compartido por toda la app.
// Monta ReactQueryDevtools — el panel flotante para inspeccionar queries en desarrollo.
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: presentation/pages, librerías de configuración global
//   ❌ NO puede importar: repositorios, Use Cases, fetch, domain directamente
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   React Query DevTools: el botón flotante que verás en la esquina es provisto
//   por <ReactQueryDevtools initialIsOpen={false} /> configurado acá.
//   staleTime: 30_000 → datos "frescos" por 30 segundos. Si el componente pide
//   datos con menos de 30s de antigüedad → devuelve cache SIN fetch (cache HIT).
//   Si tienen más de 30s → fetch en background con los datos en cache mientras espera.
// ═══════════════════════════════════════════════════════════════════════════════

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// QueryClient     = el cache de React Query. Almacena resultados de queries.
// QueryClientProvider = componente React que provee el cache a toda la app.

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// ReactQueryDevtools = panel flotante para inspeccionar el estado del cache en desarrollo.
// Muestra: qué queries existen, su queryKey, su estado (fresh/stale/fetching/error),
// los datos en cache, y cuándo expiran.
// En producción: se excluye automáticamente del bundle (solo dev).

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
      //
      // 🔍 React Query DevTools: observá el estado 'fresh' (verde) vs 'stale' (amarillo).
      // 'fresh' = datos dentro del staleTime → no hace fetch automático.
      // 'stale' = datos vencidos → fetcha en el próximo acceso.

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

      <ReactQueryDevtools initialIsOpen={false} />
      {/*
        ReactQueryDevtools: panel flotante en la esquina inferior derecha.
        "initialIsOpen={false}" → empieza cerrado (se abre con click).

        Qué se puede observar:
          - Panel izquierdo: lista de queries activas con su queryKey
            Ej: ['tareas', 'ADMIN'] y ['tareas', 'VIEWER'] como entradas separadas
          - Estado de cada query: fresh (verde) / stale (amarillo) / fetching (azul) / error (rojo)
          - Al hacer click en una query: ver los datos en cache, el queryKey completo,
            el tiempo hasta que expira (staleTime), y el tiempo hasta que se elimina del cache.
          - Al cambiar el rol en RolSwitcher: observar cómo aparece una nueva query
            con key ['tareas', nuevoRol] en estado 'fetching'.
          - Después de crear/actualizar/eliminar: observar cómo las queries ['tareas', *]
            pasan a 'stale' → 'fetching' → 'fresh' por la invalidación.
      */}
    </QueryClientProvider>
  )
}
