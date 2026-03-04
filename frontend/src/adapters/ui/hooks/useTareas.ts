// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hook Portero (Re-exports públicos)
//
// ★ Este archivo es el PORTERO — la única puerta de entrada para los componentes.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿QUÉ HACE ESTE ARCHIVO?
//
//   NADA de lógica. Solo re-exporta.
//
//   El componente importa TODO desde acá:
//     import { useListarTareas, useCrearTarea, type TareaOutput } from '@/adapters/ui/hooks/useTareas'
//
//   El componente NO sabe (ni le importa) que la implementación real está en:
//     infrastructure/state/hooks/useTareasQueries.ts
//     infrastructure/state/hooks/useTareasMutations.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ existe esta capa extra?
//
//   Sin Portero (importación directa):
//     TareaList.tsx → import from '@/infrastructure/state/hooks/useTareasQueries'
//     TareaForm.tsx → import from '@/infrastructure/state/hooks/useTareasMutations'
//     TareaItem.tsx → import from '@/infrastructure/state/hooks/useTareasMutations'
//     ← Si mañana renombrás o reorganizás infrastructure/, hay que actualizar
//       TODOS los componentes que importan de ahí.
//
//   Con Portero (este archivo):
//     TareaList.tsx → import from '@/adapters/ui/hooks/useTareas'  ← siempre igual
//     TareaForm.tsx → import from '@/adapters/ui/hooks/useTareas'  ← siempre igual
//     TareaItem.tsx → import from '@/adapters/ui/hooks/useTareas'  ← siempre igual
//     ← Si reorganizás infrastructure/, solo cambia ESTE archivo. Los componentes
//       no se enteran.
//
//   Además: "Find All References" en el editor muestra todos los consumidores
//   de un hook en un solo lugar — rastreabilidad perfecta.
//
// ─────────────────────────────────────────────────────────────────────────────
//
//   infrastructure/state/hooks/
//   ├── useTareasQueries.ts    ← implementación real (useQuery)
//   └── useTareasMutations.ts  ← implementación real (useMutation)
//              ↑
//   adapters/ui/hooks/useTareas.ts  ← ESTE ARCHIVO (solo re-exports)
//              ↑
//   presentation/components/*.tsx   ← componentes (importan solo de acá)
//
// ✅ Solo puede re-exportar — cero lógica propia
// ❌ NO puede instanciar repos, llamar hooks de React Query directamente
// ═══════════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
// Re-exports de hooks (implementación real en infrastructure/state/hooks/)
// ─────────────────────────────────────────────────────────────────────────────

export { useListarTareas } from '@/infrastructure/state/hooks/useTareasQueries'
export { useCrearTarea, useActualizarTarea, useEliminarTarea } from '@/infrastructure/state/hooks/useTareasMutations'


// ─────────────────────────────────────────────────────────────────────────────
// Re-exports de tipos (el componente los importa desde acá — no salta a domain/)
// ─────────────────────────────────────────────────────────────────────────────

export type { TareaOutput } from '@/domain/outputDTO/TareaOutput'
// OUTPUT DTO — la forma de una tarea tal como la ve el componente.

export type { CrearTareaInput, ActualizarTareaInput } from '@/application/dto/inputTareaDto'
// INPUT DTOs — la forma de los datos que el componente envía al mutar.
