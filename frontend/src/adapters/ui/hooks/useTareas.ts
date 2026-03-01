// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hook de React Query (Puente entre React y Use Cases)
//
// Analogía: el "enchufe" o "adaptador de corriente". Conecta dos mundos que
// no hablan el mismo idioma:
//   Mundo React: componentes, useState, re-renders, JSX
//   Mundo Use Cases: clases, execute(), Promises, lógica de negocio
//
// El hook hace exactamente dos cosas:
//   1. INSTANCIA el repo y el UseCase 
//   2. CONECTA el UseCase con React Query (useQuery / useMutation)
//
// NOTA SOBRE IMPORTACIÓN DE INFRASTRUCTURE:
//   Este archivo importa directamente de Infrastructure (TareaRepositoryImpl).
//   Es una "violación mínima justificada" — documentada en la arquitectura.
//   El Adapter necesita instanciar el repo para inyectárselo al UseCase.

//
// PATRÓN "HOOK PORTERO" (Re-export):
//   El componente importa TODO desde este hook — nunca salta directo a
//   domain/, application/ o infrastructure/.
//   Esto mantiene la rastreabilidad ("Find All References" muestra la cadena completa).
//
// ✅ Puede importar: dto/, domain/, infrastructure/ (violación justificada)
// ❌ NO puede importar: componentes de presentación (.tsx)
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// "useQuery"      → para operaciones de LECTURA (GET). Cachea automáticamente.
// "useMutation"   → para operaciones de ESCRITURA (POST, PUT, DELETE).
// "useQueryClient"→ para invalidar el cache y forzar re-fetch tras una mutación.
// Todos son JavaScript runtime — existen en el browser.

// ─────────────────────────────────────────────────────────────────────────────
// Re-exportación de tipos (patrón "Hook Portero")
// El componente importa estos tipos DESDE EL HOOK — nunca directamente.
// ─────────────────────────────────────────────────────────────────────────────

export type { TareaOutput } from '@/domain/outputDTO/TareaOutput'
// Re-exportamos el OUTPUT DTO para que los componentes lo usen sin saltar capas.
// "type" antes del export → TypeScript puro. Desaparece al compilar.
// El componente hace: import { useListarTareas, type TareaOutput } from '@/adapters/ui/hooks/useTareas'
// Y TypeScript sabe que TareaOutput viene de domain/outputDTO/TareaOutput — sin importarlo directo.

export type { CrearTareaInput, ActualizarTareaInput } from '@/application/dto/inputTareaDto'
// Re-exportamos los INPUT DTOs también.
// El componente hace: import { useCrearTarea, type CrearTareaInput } from '@/adapters/ui/hooks/useTareas'

// ─────────────────────────────────────────────────────────────────────────────
// Imports de Infrastructure (violación mínima justificada)
// ─────────────────────────────────────────────────────────────────────────────

import { TareaRepositoryImpl } from '@/infrastructure/repositories/TareaRepositoryImpl'
// El Adapter instancia el repo directamente — sin factory intermediaria.
// Ver doc 07, paso 5 del diagrama de secuencia.

// ─────────────────────────────────────────────────────────────────────────────
// Imports de Use Cases
// ─────────────────────────────────────────────────────────────────────────────

import { CrearTarea } from '@/application/use_cases/CrearTarea'
import { ListarTareas } from '@/application/use_cases/ListarTareas'
import { ActualizarTarea } from '@/application/use_cases/ActualizarTarea'
import { EliminarTarea } from '@/application/use_cases/EliminarTarea'

import type { CrearTareaInput, ActualizarTareaInput } from '@/application/dto/inputTareaDto'
import type { TareaOutput } from '@/domain/outputDTO/TareaOutput'

// ─────────────────────────────────────────────────────────────────────────────
// Query Key — identificador del cache de React Query
// ─────────────────────────────────────────────────────────────────────────────

const TAREAS_QUERY_KEY = ['tareas'] as const
// "as const" = TypeScript: convierte el array a una tupla de tipo literal.
// ['tareas'] → readonly ['tareas']
// React Query usa este array como clave para cachear y invalidar queries.
// Si querés invalidar la lista de tareas, usás esta misma clave.


// ─────────────────────────────────────────────────────────────────────────────
// Hook de LECTURA: useListarTareas
// ─────────────────────────────────────────────────────────────────────────────

export function useListarTareas() {
  // "function" → función JavaScript normal. Existe en runtime.
  // "export" → permite importarla desde otros archivos (los componentes).

  return useQuery<TareaOutput[], Error>({
    // "useQuery<TareaOutput[], Error>"
    //   TareaOutput[] = lo que devuelve queryFn cuando tiene éxito (TData)
    //   Error         = el tipo del error si queryFn lanza una excepción (TError)
    // Los generics "<TareaOutput[], Error>" son TypeScript — desaparecen al compilar.
    // Lo que ejecuta el browser: useQuery({ queryKey: [...], queryFn: ... })

    queryKey: TAREAS_QUERY_KEY,
    // queryKey identifica este query en el cache.
    // Si otro componente llama useListarTareas(), React Query devuelve
    // el resultado cacheado en lugar de hacer otro fetch.

    queryFn: async () => {
      // "queryFn" = la función que React Query llama para obtener los datos.
      // Es el puente: React Query → UseCase → Repositorio → API.

      const repo    = new TareaRepositoryImpl()
      // Instanciamos el repositorio concreto.
      // "new TareaRepositoryImpl()" = constructor JavaScript — existe en runtime.

      const useCase = new ListarTareas(repo)
      // Inyectamos el repo en el UseCase.
      // El UseCase no sabe que repo es TareaRepositoryImpl — solo ve ITareaRepository.

      return useCase.execute()
      // Llamamos al UseCase. Devuelve Promise<TareaOutput[]>.
      // React Query espera la Promise y almacena el resultado en cache.
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de CREACIÓN: useCrearTarea
// ─────────────────────────────────────────────────────────────────────────────

export function useCrearTarea() {
  const queryClient = useQueryClient()
  // "useQueryClient()" = acceso al cache global de React Query.
  // Lo usamos en "onSuccess" para invalidar y refrescar la lista.

  return useMutation<TareaOutput, Error, CrearTareaInput>({
    // "useMutation<TData, TError, TVariables>"
    //   TData      = TareaOutput      → lo que onSuccess(result) recibe
    //   TError     = Error            → lo que onError(error) recibe
    //   TVariables = CrearTareaInput  → lo que mutate(input) recibe
    // Los tres generics son TypeScript puro — solo existen al programar.
    // Garantizan que:
    //   - mutate() reciba exactamente un CrearTareaInput
    //   - onSuccess() reciba exactamente un TareaOutput
    //   - onError() reciba exactamente un Error

    mutationFn: async (input: CrearTareaInput) => {
      // "mutationFn" = la función que React Query llama cuando se invoca mutate(input).
      // "input: CrearTareaInput" → TypeScript verifica que el input tenga ".titulo".

      const repo    = new TareaRepositoryImpl()
      const useCase = new CrearTarea(repo)
      return useCase.execute(input)
      // execute() valida (Domain) y persiste (repo).
      // Devuelve Promise<TareaOutput> — el Output DTO de la tarea creada.
    },

    onSuccess: () => {
      // "onSuccess" se ejecuta cuando mutationFn completa SIN errores.
      // React Query lo llama automáticamente — no necesitás manejarlo vos.

      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
      // "invalidateQueries" marca el cache de ['tareas'] como obsoleto.
      // React Query re-ejecuta queryFn de useListarTareas automáticamente.
      // La UI se actualiza con la lista nueva — SIN que el componente lo maneje.
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ACTUALIZACIÓN: useActualizarTarea
// ─────────────────────────────────────────────────────────────────────────────

export function useActualizarTarea() {
  const queryClient = useQueryClient()

  return useMutation<TareaOutput, Error, { id: string; input: ActualizarTareaInput }>({
    // TVariables = { id: string; input: ActualizarTareaInput }
    // Pasamos un objeto con "id" e "input" juntos — mutate({ id, input }).
    // "{ id: string; input: ActualizarTareaInput }" es TypeScript inline.
    // Defines la forma del objeto sin crear una interface separada.

    mutationFn: async ({ id, input }: { id: string; input: ActualizarTareaInput }) => {
      // Destructuring con tipo explícito: TypeScript necesita saber el tipo del parámetro.
      // "{ id, input }" extrae las propiedades del objeto.
      // ": { id: string; input: ActualizarTareaInput }" = el tipo del parámetro completo.
      // Equivalente a: const id = variables.id; const input = variables.input;

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
// Hook de ELIMINACIÓN: useEliminarTarea
// ─────────────────────────────────────────────────────────────────────────────

export function useEliminarTarea() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    // TData      = void   → eliminar no devuelve ningún objeto
    // TError     = Error
    // TVariables = string → mutate("el-uuid-de-la-tarea")

    mutationFn: async (id: string) => {
      // Esta vez TVariables es un string simple — no necesitamos objeto.
      const repo    = new TareaRepositoryImpl()
      const useCase = new EliminarTarea(repo)
      return useCase.execute(id)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
    },
  })
}
