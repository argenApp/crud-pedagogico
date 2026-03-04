// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: INFRASTRUCTURE — State Hooks — Mutations (React Query / Escritura)
//
// ★ Este archivo contiene SOLO hooks de ESCRITURA (useMutation).
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿Por qué separar Queries y Mutations en archivos distintos?
//
//   Queries  → operaciones de LECTURA (GET)   → sin efectos secundarios
//   Mutations → operaciones de ESCRITURA       → tienen efectos secundarios
//               (POST, PUT, DELETE)              (invalidan cache, pueden
//                                                 disparar notificaciones, etc.)
//
//   Al crecer el proyecto, las mutations acumulan lógica de onSuccess/onError
//   (notificaciones, redirects, logs). Tenerlas en su propio archivo las mantiene
//   manejables sin contaminar la lógica de lectura.
//
// ─────────────────────────────────────────────────────────────────────────────
// RECORRIDO DE CAPAS (escritura — pasa por UseCase + Domain):
//
//   Presentation (componente llama mutate(input))
//       ↓
//   Adapter (useTareas.ts — portero re-exporta este hook)
//       ↓
//   infrastructure/state/hooks/ (este archivo — mutationFn real)
//       ↓
//   Application (UseCase — valida + orquesta)
//       ↓
//   Domain (Entity.validarCreacion — reglas de negocio)
//       ↓
//   infrastructure/repositories/TareaRepositoryImpl.ts
//       ↓
//   HTTP POST / PUT / DELETE
//       ↓
//   onSuccess → invalidateQueries(TAREAS_QUERY_KEY)
//       ↓
//   React Query detecta MISS → GET fresco → UI actualizada
//
// ✅ Puede importar: repositorios, use cases, react-query, TAREAS_QUERY_KEY
// ❌ NO puede importar: componentes de presentación (.tsx), stores de Zustand
// ═══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TAREAS_QUERY_KEY } from './useTareasQueries'
// Importamos la query key desde Queries — una sola fuente de verdad.
// Si la clave cambia, solo se actualiza en useTareasQueries.ts.

import { TareaRepositoryImpl } from '@/infrastructure/repositories/TareaRepositoryImpl'
import { CrearTarea }      from '@/application/use_cases/CrearTarea'
import { ActualizarTarea } from '@/application/use_cases/ActualizarTarea'
import { EliminarTarea }   from '@/application/use_cases/EliminarTarea'

import type { CrearTareaInput, ActualizarTareaInput } from '@/application/dto/inputTareaDto'
import type { TareaOutput } from '@/domain/outputDTO/TareaOutput'


// ─────────────────────────────────────────────────────────────────────────────
// Hook de CREACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export function useCrearTarea() {
  const queryClient = useQueryClient()
  // "useQueryClient()" → referencia al cache global de React Query.
  // Necesaria para invalidar el cache después de crear.

  return useMutation<TareaOutput, Error, CrearTareaInput>({
    // useMutation<TData, TError, TVariables>
    //   TData      = TareaOutput     → lo que devuelve mutationFn
    //   TError     = Error           → tipo del error si falla
    //   TVariables = CrearTareaInput → tipo del argumento de mutate()

    mutationFn: async (input: CrearTareaInput) => {
      // ESCRITURA: instancia UseCase → valida en Domain → persiste en repo
      const repo    = new TareaRepositoryImpl()
      const useCase = new CrearTarea(repo)
      return useCase.execute(input)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
      // Borra el cache de ['tareas'] → React Query detecta MISS
      // → re-fetch automático → lista actualizada en pantalla.
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ACTUALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export function useActualizarTarea() {
  const queryClient = useQueryClient()

  return useMutation<TareaOutput, Error, { id: string; input: ActualizarTareaInput }>({
    // TVariables = { id, input } porque PUT necesita el ID del recurso a actualizar.
    // useMutation solo acepta UN parámetro en mutate() → lo agrupamos en un objeto.

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
    // TData = void → DELETE no devuelve cuerpo (HTTP 204 No Content).
    // TVariables = string → solo necesitamos el ID.

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
