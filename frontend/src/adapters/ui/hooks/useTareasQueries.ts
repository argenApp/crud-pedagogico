// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hook de Lectura (React Query / useQuery)
//
// ★ El hook ES el Adapter: conecta el mundo React con la capa de Application.
//   "Enchufado" = instancia el repo (Infrastructure) + el UseCase (Application)
//   y los conecta con el sistema de cache de React Query.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ en adapters/ y no en infrastructure/?
//
//   Infrastructure = repositorios, API clients, stores de Zustand — herramientas
//   que hablan con el exterior (servidor, localStorage, RAM).
//
//   Adapter = el "enchufe" que conecta mundos distintos:
//     Mundo React (hooks, re-renders, componentes)
//     Mundo Application (UseCases, execute(), Promises puras)
//
//   Este hook es ese enchufe: toma el UseCase (Application) y lo envuelve en
//   React Query (React). Eso es responsabilidad del Adapter, no de Infrastructure.
//
// ─────────────────────────────────────────────────────────────────────────────
// RECORRIDO DE CAPAS (lectura — omite UseCase+Domain para GET):
//
//   Presentation → Adapter (este hook) → Infrastructure (repo) → HTTP GET
//   ↑ cache HIT (~5ms) si los datos existen y son frescos
//   ↑ cache MISS → queryFn ejecuta → fetch → guarda en cache
//
// ✅ Puede importar: infrastructure (repos), application (use cases), domain (tipos)
// ❌ NO puede importar: componentes .tsx, stores de Zustand
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query'
import { TareaRepositoryImpl } from '@/infrastructure/repositories/TareaRepositoryImpl'
import { ListarTareas } from '@/application/useCases/Tareas/ListarTareas'
import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'


// ─────────────────────────────────────────────────────────────────────────────
// Query Key — exportada para que useTareasMutations la use al invalidar
// ─────────────────────────────────────────────────────────────────────────────

export const TAREAS_QUERY_KEY = ['tareas'] as const
// Exportada desde Queries porque la "dueña" de la clave es la lectura.
// Las mutaciones la importan para saber qué invalidar al escribir.


// ─────────────────────────────────────────────────────────────────────────────
// Re-export de tipos — el componente importa todo desde este hook
// ─────────────────────────────────────────────────────────────────────────────

export type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// El componente hace: import { useListarTareas, type TareaOutputDTO } from './useTareasQueries'
// No necesita saber que TareaOutputDTO viene de domain/ — lo obtiene del Adapter.


// ─────────────────────────────────────────────────────────────────────────────
// Hook de LECTURA
// ─────────────────────────────────────────────────────────────────────────────

export function useListarTareas() {
  return useQuery<TareaOutputDTO[], Error>({
    queryKey: TAREAS_QUERY_KEY,
    queryFn: async () => {
      // Cache MISS: instanciamos el repo y llamamos al UseCase.
      const repo    = new TareaRepositoryImpl()
      const useCase = new ListarTareas(repo)
      return useCase.execute()
    },
  })
}
