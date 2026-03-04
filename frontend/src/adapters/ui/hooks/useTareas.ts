// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hook de React Query (Puente entre React y Use Cases)
//
// Analogía: el "enchufe" o "adaptador de corriente". Conecta dos mundos que
// no hablan el mismo idioma:
//   Mundo React: componentes, useState, re-renders, JSX
//   Mundo Use Cases: clases, execute(), Promises, lógica de negocio
//
// ─────────────────────────────────────────────────────────────────────────────
// ARQUITECTURA DE ESTADO DUAL: Zustand + React Query
//
// El frontend tiene DOS herramientas de estado con responsabilidades distintas:
//
//   ┌─────────────────────────────────────────────────────────────────┐
//   │                   CAPA DE PRESENTACIÓN                          │
//   │                  (Componentes React)                            │
//   └────────┬───────────────────────────────┬────────────────────────┘
//            │                               │
//            │ Estado de UI                  │ Datos del Servidor
//            ▼                               ▼
//   ┌──────────────────┐         ┌──────────────────────────────────┐
//   │    ZUSTAND        │         │         REACT QUERY              │
//   │  (Estado Cliente) │         │    (Cache Estado Servidor)       │
//   ├──────────────────┤         ├──────────────────────────────────┤
//   │ • selectedId      │         │ • useQuery     (LECTURA)         │
//   │ • isModalOpen     │         │ • useMutation  (ESCRITURA)       │
//   │ • filters         │         │ • Cache: lógica HIT/MISS         │
//   │ • theme (persist) │         │ • Estrategia de invalidación     │
//   └──────────────────┘         └────────────┬─────────────────────┘
//                                             │
//                                             ▼
//                                    ┌────────────────────┐
//                                    │    REPOSITORY       │
//                                    │  (Cliente HTTP)     │
//                                    └────────────────────┘
//
// → ZUSTAND = estado efímero de UI (qué fila está seleccionada, si un modal está abierto).
//             Se pierde al recargar. Solo en RAM. No hace HTTP.
// → REACT QUERY = cache de datos del servidor. Sabe cuándo los datos están "frescos"
//                 o "obsoletos" y decide si hacer fetch o devolver del cache.
//
// En este CRUD simple no usamos Zustand porque no hay estado de UI complejo.
// Solo necesitamos leer y escribir tareas → React Query es suficiente.
//
// Matriz de decisión:
//   Fila seleccionada en tabla  → Zustand volátil   ← este CRUD no lo necesita
//   Preferencia de tema (dark)  → Zustand + persist ← este CRUD no lo necesita
//   Lista de tareas del backend → React Query       ← ESTO usamos aquí
//
// ─────────────────────────────────────────────────────────────────────────────
// LECTURA vs ESCRITURA: capas recorridas (crítico para entender Clean Arch)
//
//   ESCRITURA (useMutation) — pasa por TODAS las capas:
//   ┌────────────────────────────────────────────────────────────────┐
//   │ Presentation → Adapter → Application (UseCase) →              │
//   │ Domain (Entity.validate) → Infrastructure → HTTP POST/PUT/DEL │
//   └────────────────────────────────────────────────────────────────┘
//   ✅ Validación de input requerida
//   ✅ Reglas de negocio deben cumplirse
//   ✅ Puede haber efectos secundarios
//
//   LECTURA (useQuery) — OMITE UseCase + Domain:
//   ┌────────────────────────────────────────────────────────────────┐
//   │ Presentation → Adapter → Infrastructure → HTTP GET            │
//   └────────────────────────────────────────────────────────────────┘
//   ✅ Sin validación — los datos ya fueron validados al crearse
//   ✅ Sin reglas de negocio — solo mostrar lo que existe
//   ✅ Performance optimizado — usa cache (HIT: 5ms, MISS: 200-500ms)
//
// ─────────────────────────────────────────────────────────────────────────────
// PATRÓN "HOOK PORTERO" (Re-export):
//   El componente importa TODO desde este hook — nunca salta directo a
//   domain/, application/ o infrastructure/.
//   Esto mantiene la rastreabilidad ("Find All References" muestra la cadena completa).
//
// NOTA SOBRE IMPORTACIÓN DE INFRASTRUCTURE:
//   Este archivo importa directamente de Infrastructure (TareaRepositoryImpl).
//   Es una "violación mínima justificada" — documentada en la arquitectura.
//   El Adapter necesita instanciar el repo para inyectárselo al UseCase.
//
// ✅ Puede importar: dto/, domain/, infrastructure/ (violación justificada)
// ❌ NO puede importar: componentes de presentación (.tsx)
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// "useQuery"       → operaciones de LECTURA (GET).
//                    Cachea automáticamente. Omite UseCase+Domain.
//                    Recorrido: Adapter → Infrastructure → HTTP GET
//
// "useMutation"    → operaciones de ESCRITURA (POST, PUT, DELETE).
//                    Pasa por UseCase+Domain. No cachea — invalida.
//                    Recorrido: Adapter → UseCase → Domain → Infrastructure → HTTP
//
// "useQueryClient" → acceso al cache global de React Query.
//                    Lo usamos en onSuccess para invalidar el cache.

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
// React Query mantiene un cache en memoria (RAM) indexado por estas claves:
//
//   Cache interno (simplificado):
//   {
//     "['tareas']": {
//       data: [{ id: '...', titulo: 'Comprar leche', completada: false, ... }, ...],
//       timestamp: 1709473891234,   ← cuándo se hizo el fetch
//       staleTime: 0,               ← después de 0ms los datos se consideran "obsoletos"
//     }
//   }
//
// "as const" = TypeScript: convierte el array a una tupla de tipo literal.
// ['tareas'] → readonly ['tareas']
// Usar la misma constante en queryKey e invalidateQueries garantiza que
// coincidan exactamente — si usás un string distinto, la invalidación no funciona.
//
// La clave actúa como "prefijo": invalidateQueries({ queryKey: ['tareas'] })
// elimina TODAS las entradas que empiecen con 'tareas' del cache.


// ─────────────────────────────────────────────────────────────────────────────
// Hook de LECTURA: useListarTareas
//
// RECORRIDO DE CAPAS (solo lectura — NO pasa por UseCase ni Domain):
//
//   Presentation (componente llama useListarTareas())
//       ↓
//   Adapter (este hook — verifica cache)
//       ↓
//   ┌──────────────────────────────────────────┐
//   │  CACHE HIT (datos frescos en memoria)    │
//   │  ↓                                       │
//   │  Retorna inmediatamente (~5ms)           │
//   └──────────────────────────────────────────┘
//   ┌──────────────────────────────────────────┐
//   │  CACHE MISS (no hay datos o son viejos)  │
//   │  ↓                                       │
//   │  Infrastructure (TareaRepositoryImpl)    │
//   │  ↓                                       │
//   │  HTTP GET /api/v1/tareas/                │
//   │  ↓                                       │
//   │  Guarda en cache con timestamp           │
//   │  Retorna (~200-500ms, depende de red)    │
//   └──────────────────────────────────────────┘
//
// ¿Por qué NO pasa por UseCase + Domain?
//   Los datos ya fueron validados cuando se crearon.
//   No hay reglas de negocio que aplicar al mostrarlos — solo mostrarlos.
//   Pasar por UseCase sería agregar complejidad innecesaria.
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
    // queryKey identifica ESTE query en el cache.
    // Si otro componente llama useListarTareas() mientras hay un resultado cacheado,
    // React Query devuelve los datos del cache (HIT) → sin hacer otro fetch.
    // Si los datos son obsoletos o no existen (MISS) → llama queryFn.

    queryFn: async () => {
      // "queryFn" = la función que React Query llama cuando hay CACHE MISS.
      // Solo se ejecuta si el cache está vacío o los datos son obsoletos.
      // React Query espera la Promise y guarda el resultado en cache.
      //
      // RECORRIDO: Adapter → Infrastructure → HTTP GET (sin UseCase, sin Domain)

      const repo    = new TareaRepositoryImpl()
      // Instanciamos el repositorio concreto.
      // "new TareaRepositoryImpl()" = constructor JavaScript — existe en runtime.

      const useCase = new ListarTareas(repo)
      // ⚠️ Nota: useListarTareas SÍ usa UseCase para listar (orquesta el repo).
      // La diferencia es que el UseCase de listado no valida ni aplica reglas —
      // simplemente delega al repo. En un sistema más complejo, listar podría
      // ir directo al repo (sin UseCase), como muestra el diagrama de lectura.

      return useCase.execute()
      // Devuelve Promise<TareaOutput[]>.
      // React Query almacena el array en cache bajo la clave ['tareas'].
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de CREACIÓN: useCrearTarea
//
// RECORRIDO DE CAPAS (escritura — pasa por UseCase + Domain):
//
//   Presentation (usuario envía formulario → mutate({ titulo: '...' }))
//       ↓
//   Adapter (este hook — mutationFn)
//       ↓
//   Application (UseCase CrearTarea)
//       ├─ Llama TareaEntity.validarCreacion(titulo)
//       ├─ Si inválido → lanza Error → onError (componente muestra mensaje)
//       ↓
//   Domain (TareaEntity.validarCreacion)
//       ├─ Verifica largo mínimo, no vacío, etc.
//       ↓
//   Infrastructure (TareaRepositoryImpl)
//       ↓
//   HTTP POST /api/v1/tareas/
//       ↓
//   Servidor crea la tarea → responde 201 Created
//       ↓
//   onSuccess → invalidateQueries(['tareas'])
//       ↓
//   Cache borrado → useListarTareas detecta MISS → GET fresco
//       ↓
//   Lista actualizada automáticamente en pantalla
// ─────────────────────────────────────────────────────────────────────────────

export function useCrearTarea() {
  const queryClient = useQueryClient()
  // "useQueryClient()" = acceso al cache global de React Query.
  // Es como una "referencia al almacén de cache" — necesaria para invalidar.
  // Sin esto no podríamos decirle a React Query "borrá los datos viejos".

  return useMutation<TareaOutput, Error, CrearTareaInput>({
    // "useMutation<TData, TError, TVariables>"
    //   TData      = TareaOutput      → lo que onSuccess(result) recibe
    //   TError     = Error            → lo que onError(error) recibe
    //   TVariables = CrearTareaInput  → lo que mutate(input) recibe
    // Los tres generics son TypeScript puro — solo existen al programar.
    // Garantizan que:
    //   - mutate() reciba exactamente un CrearTareaInput (con .titulo)
    //   - onSuccess() reciba exactamente un TareaOutput (la tarea creada)
    //   - onError() reciba exactamente un Error (con .message)

    mutationFn: async (input: CrearTareaInput) => {
      // "mutationFn" = la función que React Query llama cuando se invoca mutate(input).
      // A diferencia de queryFn, mutationFn SIEMPRE ejecuta (no usa cache).
      // "input: CrearTareaInput" → TypeScript verifica que el input tenga ".titulo".
      //
      // ESCRITURA: pasa por UseCase + Domain (validación + reglas de negocio)

      const repo    = new TareaRepositoryImpl()
      const useCase = new CrearTarea(repo)
      return useCase.execute(input)
      // execute() hace dos cosas:
      //   1. Llama TareaEntity.validarCreacion(titulo) → Domain valida
      //   2. Llama repo.crear(input) → Infrastructure guarda en backend
      // Devuelve Promise<TareaOutput> — el Output DTO de la tarea creada.
    },

    onSuccess: () => {
      // "onSuccess" se ejecuta cuando mutationFn completa SIN errores.
      // React Query lo llama automáticamente — no necesitás manejarlo en el componente.

      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
      // "invalidateQueries" = borrar entradas del cache que coincidan con ['tareas'].
      //
      // ¿Qué pasa exactamente?
      //   Antes:  cache['tareas'] = [tarea1, tarea2]          ← datos viejos
      //   Después: cache['tareas'] = undefined (eliminado)    ← cache limpio
      //
      // React Query detecta automáticamente que el cache está vacío.
      // Si useListarTareas() está montado en pantalla → CACHE MISS → nuevo GET.
      // La lista se actualiza con la nueva tarea — SIN que el componente lo maneje.
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ACTUALIZACIÓN: useActualizarTarea
//
// Mismo recorrido que useCrearTarea (escritura pasa por UseCase + Domain).
// La diferencia: TVariables es { id, input } porque necesitamos el ID del recurso.
// ─────────────────────────────────────────────────────────────────────────────

export function useActualizarTarea() {
  const queryClient = useQueryClient()

  return useMutation<TareaOutput, Error, { id: string; input: ActualizarTareaInput }>({
    // TVariables = { id: string; input: ActualizarTareaInput }
    // Pasamos un objeto con "id" e "input" juntos — mutate({ id, input }).
    // "{ id: string; input: ActualizarTareaInput }" es TypeScript inline.
    // Defines la forma del objeto sin crear una interface separada.
    //
    // ¿Por qué un objeto y no dos parámetros?
    //   mutationFn solo acepta UN parámetro (TVariables).
    //   Si necesitás pasar múltiples valores, los agrupás en un objeto.

    mutationFn: async ({ id, input }: { id: string; input: ActualizarTareaInput }) => {
      // Destructuring con tipo explícito: TypeScript necesita saber el tipo del parámetro.
      // "{ id, input }" extrae las propiedades del objeto.
      // ": { id: string; input: ActualizarTareaInput }" = el tipo del parámetro completo.
      // Equivalente a: const id = variables.id; const input = variables.input;
      //
      // ESCRITURA: pasa por UseCase + Domain (valida nuevo título + reglas de negocio)

      const repo    = new TareaRepositoryImpl()
      const useCase = new ActualizarTarea(repo)
      return useCase.execute(id, input)
    },

    onSuccess: () => {
      // Misma invalidación: marca cache de ['tareas'] como obsoleto.
      // → MISS → GET fresco → lista actualizada en pantalla automáticamente.
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
    },
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ELIMINACIÓN: useEliminarTarea
//
// TData = void porque DELETE no devuelve un objeto (HTTP 204 No Content).
// TVariables = string porque solo necesitamos el ID.
// ─────────────────────────────────────────────────────────────────────────────

export function useEliminarTarea() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    // TData      = void   → eliminar no devuelve ningún objeto (HTTP 204)
    // TError     = Error
    // TVariables = string → mutate("el-uuid-de-la-tarea")
    //
    // Cuando TVariables es un tipo simple (string, number), mutate("uuid")
    // recibe directamente el valor — sin necesidad de envolverlo en un objeto.

    mutationFn: async (id: string) => {
      // Esta vez TVariables es un string simple — no necesitamos objeto.
      //
      // ESCRITURA: pasa por UseCase (verifica que la tarea exista) → repo → HTTP DELETE

      const repo    = new TareaRepositoryImpl()
      const useCase = new EliminarTarea(repo)
      return useCase.execute(id)
    },

    onSuccess: () => {
      // Eliminar también invalida: la tarea ya no existe → lista debe refrescarse.
      //
      // Flujo completo de invalidación:
      //   1. DELETE /api/v1/tareas/{id}  → servidor elimina
      //   2. onSuccess → invalidateQueries(['tareas'])
      //   3. Cache limpiado → MISS detectado
      //   4. GET /api/v1/tareas/  → lista sin la tarea eliminada
      //   5. Componente re-renderiza → la tarea desaparece de pantalla
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY })
    },
  })
}
