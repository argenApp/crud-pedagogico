// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: INFRASTRUCTURE — State Hooks — Queries (React Query / Lectura)
//
// ★ Este archivo contiene SOLO hooks de LECTURA (useQuery).
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ hooks de lectura en infrastructure/state/hooks/ y no en adapters/?
//
//   infrastructure/state/hooks/  = IMPLEMENTACIÓN
//     → Aquí vive el queryFn real: instancia el repo, llama el UseCase, hace fetch.
//     → Es "infraestructura de estado" del cliente — igual que un repositorio
//       es "infraestructura de datos" del servidor.
//
//   adapters/ui/hooks/useTareas.ts = INTERFAZ PÚBLICA (Portero)
//     → Solo re-exporta desde acá. No tiene lógica.
//     → El componente importa del Portero, nunca llega aquí directamente.
//
//   La separación permite:
//     → Cambiar React Query por SWR o Apollo → solo cambia este archivo.
//     → El componente no se entera — sigue importando del Portero.
//
// ─────────────────────────────────────────────────────────────────────────────
// RECORRIDO DE CAPAS (lectura — omite UseCase + Domain):
//
//   Presentation (componente)
//       ↓
//   Adapter (useTareas.ts — portero re-exporta este hook)
//       ↓
//   infrastructure/state/hooks/ (este archivo — queryFn real)
//       ↓
//   React Query verifica cache (HIT: ~5ms | MISS: ejecuta queryFn)
//       ↓  (solo en MISS)
//   infrastructure/repositories/TareaRepositoryImpl.ts
//       ↓
//   HTTP GET /api/v1/tareas/
//
// ✅ Puede importar: repositorios, use cases, react-query
// ❌ NO puede importar: componentes de presentación (.tsx), stores de Zustand
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query'
import { TareaRepositoryImpl } from '@/infrastructure/repositories/TareaRepositoryImpl'
import { ListarTareas } from '@/application/use_cases/ListarTareas'
import type { TareaOutput } from '@/domain/outputDTO/TareaOutput'


// ─────────────────────────────────────────────────────────────────────────────
// Query Key — exportada para que useTareasMutations la use al invalidar
// ─────────────────────────────────────────────────────────────────────────────

export const TAREAS_QUERY_KEY = ['tareas'] as const
// Se exporta desde QUERIES (no desde mutations) porque el query key
// "pertenece" a la lectura — las mutaciones lo importan para invalidar.
// Tener la clave en un solo lugar evita typos: si escribís ['tarea'] en
// un lado y ['tareas'] en otro, la invalidación no funciona.


// ─────────────────────────────────────────────────────────────────────────────
// Hook de LECTURA: useListarTareas
// ─────────────────────────────────────────────────────────────────────────────

export function useListarTareas() {
  return useQuery<TareaOutput[], Error>({
    queryKey: TAREAS_QUERY_KEY,
    // La clave identifica este query en el cache de React Query.
    // Si el cache tiene datos frescos → HIT → devuelve sin fetch.
    // Si el cache está vacío o los datos expiraron → MISS → ejecuta queryFn.

    queryFn: async () => {
      // Se ejecuta solo en CACHE MISS.
      // Instanciamos aquí (no en el componente) para mantener la lógica
      // de infraestructura fuera de la Presentation.

      const repo    = new TareaRepositoryImpl()
      const useCase = new ListarTareas(repo)
      return useCase.execute()
      // Devuelve Promise<TareaOutput[]> → React Query lo guarda en cache.
    },
  })
}
