// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hooks de Escritura (React Query / useMutation)
//
// Posición en la cadena de dependencias:
//   Presentation → useCrearTarea().mutate(input) → mutationFn → CrearTarea.execute()
//               → Domain (TareaEntity.validarCreacion) → repo → HTTP POST/PUT/DELETE
//               → onSuccess → invalidateQueries → GET fresco → UI actualizada
//
// Adapter entre React Query y los UseCases de escritura.
// ★ El hook ES el Adapter: conecta el mundo React con UseCase + Domain + repo.
//   "Enchufado" = instancia repo (Infrastructure) + UseCase (Application) y los
//   envuelve en useMutation para que React Query maneje el ciclo de vida async.
//
// ─────────────────────────────────────────────────────────────────────────────
// ★ INVALIDACIÓN CON ROL EN EL QUERYKEY
//
//   Las queries ahora tienen keys: ['tareas', 'ADMIN'] y ['tareas', 'VIEWER']
//   Al invalidar con TAREAS_BASE_KEY = ['tareas'], React Query invalida TODAS
//   las variantes cuya key COMIENZA con ['tareas'] — es decir, ambas.
//
//   queryClient.invalidateQueries({ queryKey: ['tareas'] })
//     → invalida ['tareas', 'ADMIN']  ✅
//     → invalida ['tareas', 'VIEWER'] ✅
//
//   Esto es el "prefix matching" de React Query.
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: infrastructure (repos), application (use cases + inputDTO), domain
//   ❌ NO puede importar: componentes .tsx, stores de Zustand
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Network: POST/PUT/DELETE aparecen acá.
//   React Query DevTools: después de onSuccess → query ['tareas', *] pasa a
//   'invalidated' → 'fetching' → 'fresh' automáticamente.
// ═══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TAREAS_BASE_KEY } from './useTareasQueries'
// Importamos TAREAS_BASE_KEY desde el archivo de queries.
// Es la raíz ['tareas'] — invalida TODAS las variantes de rol de una vez.
//
// 🔍 React Query DevTools: prefix matching — invalida ['tareas', 'ADMIN']
// Y ['tareas', 'VIEWER'] de un solo golpe al usar esta key base.

import { TareaRepositoryImpl } from '@/infrastructure/repositories/TareaRepositoryImpl'
import { CrearTarea }      from '@/application/useCases/Tareas/CrearTarea'
import { ActualizarTarea } from '@/application/useCases/Tareas/ActualizarTarea'
import { EliminarTarea }   from '@/application/useCases/Tareas/EliminarTarea'

import type { CrearTareaInput, ActualizarTareaInput } from '@/application/inputDTO/TareaInputDTO'
import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'


// ─────────────────────────────────────────────────────────────────────────────
// Re-export de tipos — el componente importa todo desde este hook
// ─────────────────────────────────────────────────────────────────────────────

export type { TareaOutputDTO }          from '@/domain/outputDTO/TareaOutputDTO'
export type { CrearTareaInput, ActualizarTareaInput } from '@/application/inputDTO/TareaInputDTO'
// Hook Portero: Iron Law 1 garantizado — Presentation NUNCA importa de Infrastructure.
// El componente importa TareaOutputDTO desde acá, no desde domain/ directamente.


// ─────────────────────────────────────────────────────────────────────────────
// Hook de CREACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export function useCrearTarea() {
  const queryClient = useQueryClient()

  return useMutation<TareaOutputDTO, Error, CrearTareaInput>({
    mutationFn: async (input: CrearTareaInput) => {
      // El mutationFn instancia repo + UseCase en el momento de la mutación.
      // (No hay factories/ — el hook hace la instanciación directamente.)
      const repo    = new TareaRepositoryImpl()
      const useCase = new CrearTarea(repo)
      return useCase.execute(input)
      // UseCase valida en Domain → si falla → Error → onError del componente
      // UseCase persiste en repo → devuelve TareaOutputDTO → onSuccess
    },
    onSuccess: () => {
      // 🔍 React Query DevTools: observá cómo la query ['tareas', 'ADMIN'] y
      // ['tareas', 'VIEWER'] pasan a 'stale' → 'fetching' automáticamente.
      queryClient.invalidateQueries({ queryKey: TAREAS_BASE_KEY })
      // TAREAS_BASE_KEY = ['tareas']
      // Invalida ['tareas', 'ADMIN'] Y ['tareas', 'VIEWER'] de una sola vez.
      // React Query usa prefix matching: todo queryKey que empiece con ['tareas']
      // queda invalidado → ambos roles ven datos frescos en su próximo render.
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ACTUALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export function useActualizarTarea() {
  const queryClient = useQueryClient()

  return useMutation<TareaOutputDTO, Error, { id: string; input: ActualizarTareaInput }>({
    mutationFn: async ({ id, input }: { id: string; input: ActualizarTareaInput }) => {
      const repo    = new TareaRepositoryImpl()
      const useCase = new ActualizarTarea(repo)
      return useCase.execute(id, input)
      // 🔍 Network: PUT /api/v1/tareas/{id} con { titulo, completada }
    },
    onSuccess: () => {
      // 🔍 React Query DevTools: después de un PUT exitoso → ambas queries
      // ['tareas', 'ADMIN'] y ['tareas', 'VIEWER'] se invalidan y re-fetchan.
      queryClient.invalidateQueries({ queryKey: TAREAS_BASE_KEY })
      // Importante: si un VIEWER marca una tarea como completada,
      // después de la invalidación el VIEWER la verá en su lista (porque
      // VIEWER ve solo completadas). Antes de completarla, no la veía.
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
      // 🔍 Network: DELETE /api/v1/tareas/{id} → status 204 sin body.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAREAS_BASE_KEY })
    },
  })
}
