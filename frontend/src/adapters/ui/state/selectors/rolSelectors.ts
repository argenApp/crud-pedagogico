// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — State Selectors: Rol
//
// Posición en la cadena de dependencias:
//   Presentation (RolSwitcher, useTareasQueries) → useRolStore(selectRol)
//   Los selectores son funciones puras — no son hooks, no tienen estado propio.
//
// Los selectores permiten que los componentes y hooks se suscriban a UNA SOLA
// parte del store — sin re-renderizar cuando cambia otra parte no relacionada.
//
// Convención del proyecto:
//   - Sin prefijo "use" (no son hooks, son funciones puras)
//   - Un archivo de selectores por store
//   - Cada selector recibe el estado completo y devuelve la parte necesaria
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: solo tipos de TypeScript
//   ❌ NO puede importar: React, zustand, componentes, infrastructure
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   React DevTools > Components > useListarTareas → hooks[0] (useRolStore):
//   State: 'ADMIN'|'VIEWER'. El selectRol garantiza que solo re-renderiza
//   cuando el ROL cambia, no si otra parte del store cambia.
//   React Query DevTools: al cambiar el rol → nueva query con key ['tareas', nuevoRol]
//   aparece en el panel izquierdo, demostrando la cadena completa:
//   setRol → selectRol → queryKey nueva → re-fetch → UseCase filtra → UI actualizada.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Rol } from '@/domain/roles/Rol'

// Tipo mínimo que este selector necesita del store.
// No importamos el store completo — el selector es agnóstico de la implementación.
interface RolState {
  rol: Rol
  setRol: (rol: Rol) => void
}

export const selectRol = (state: RolState): Rol =>
  state.rol
// Selector para leer el rol activo.
// Uso: const rol = useRolStore(selectRol)
// Re-renderiza el componente SOLO cuando "rol" cambia.
//
// 🔍 React DevTools: hooks del componente que usa selectRol →
// el valor 'ADMIN' o 'VIEWER' cambia en tiempo real al hacer click en RolSwitcher.

export const selectSetRol = (state: RolState): ((rol: Rol) => void) =>
  state.setRol
// Selector para obtener la función de cambio.
// Las funciones de Zustand son estables (referencia igual en cada render).
// Uso: const setRol = useRolStore(selectSetRol)
//
// 🔍 React Query DevTools: cuando el componente llama setRol('VIEWER') →
// el queryKey de useTareasQueries cambia a ['tareas', 'VIEWER'] →
// aparece una nueva query en el panel → se hace un nuevo GET /api/v1/tareas/
// → UseCase aplica ReglaRol → VIEWER ve solo las completadas.
