// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hooks de Escritura (React Query / useMutation)
//
// ★ El hook ES el Adapter: conecta el mundo React con UseCase + Domain + repo.
//   "Enchufado" = instancia repo (Infrastructure) + UseCase (Application) y los
//   envuelve en useMutation para que React Query maneje el ciclo de vida async.
//
// ─────────────────────────────────────────────────────────────────────────────
// RECORRIDO DE CAPAS (escritura — DEBE pasar por UseCase + Domain):
//
//   Presentation → Adapter (este hook) → Application (UseCase)
//              → Domain (Entity.validarCreacion) → Infrastructure (repo) → HTTP
//              → onSuccess → invalidateQueries → GET fresco → UI actualizada
//
// ✅ Puede importar: infrastructure (repos), application (use cases + dto), domain
// ❌ NO puede importar: componentes .tsx, stores de Zustand
// ═══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TAREAS_QUERY_KEY } from './useTareasQueries'
// La clave viene de Queries — única fuente de verdad para invalidación.

import { TareaRepositoryImpl } from '@/infrastructure/repositories/TareaRepositoryImpl'
import { CrearTarea }      from '@/application/use_cases/CrearTarea'
import { ActualizarTarea } from '@/application/use_cases/ActualizarTarea'
import { EliminarTarea }   from '@/application/use_cases/EliminarTarea'

import type { CrearTareaInput, ActualizarTareaInput } from '@/application/dto/inputTareaDto'
import type { TareaOutput } from '@/domain/outputDTO/TareaOutput'


// ─────────────────────────────────────────────────────────────────────────────
// Re-export de tipos — el componente importa todo desde este hook
// ─────────────────────────────────────────────────────────────────────────────

export type { TareaOutput }          from '@/domain/outputDTO/TareaOutput'
export type { CrearTareaInput, ActualizarTareaInput } from '@/application/dto/inputTareaDto'


// ─────────────────────────────────────────────────────────────────────────────
// Hook de CREACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export function useCrearTarea() {
  const queryClient = useQueryClient()

  return useMutation<TareaOutput, Error, CrearTareaInput>({
    mutationFn: async (input: CrearTareaInput) => {
      const repo    = new TareaRepositoryImpl()
      const useCase = new CrearTarea(repo)
      return useCase.execute(input)
      // UseCase valida en Domain → persiste en repo → devuelve TareaOutput
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
      // Cache borrado → MISS → GET fresco → lista actualizada automáticamente
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ACTUALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export function useActualizarTarea() {
  const queryClient = useQueryClient()

  return useMutation<TareaOutput, Error, { id: string; input: ActualizarTareaInput }>({
    mutationFn: async ({ id, input }: { id: string; input: ActualizarTareaInput }) => {
      const repo    = new TareaRepositoryImpl()
      const useCase = new ActualizarTarea(repo)
      return useCase.execute(id, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ELIMINACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export function useEliminarTarea() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    // TData = void → DELETE no devuelve cuerpo (HTTP 204 No Content)
    mutationFn: async (id: string) => {
      const repo    = new TareaRepositoryImpl()
      const useCase = new EliminarTarea(repo)
      return useCase.execute(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
    },
  })
}
