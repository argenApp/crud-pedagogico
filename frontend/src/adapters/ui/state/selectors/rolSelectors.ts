// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Selectores del store de Rol
//
// Los selectores permiten que los componentes se suscriban a UNA SOLA parte
// del store — sin re-renderizar cuando cambia otra parte no relacionada.
//
// Convención del proyecto:
//   - Sin prefijo "use" (no son hooks, son funciones puras)
//   - Un archivo de selectores por store
//   - Cada selector recibe el estado completo y devuelve la parte necesaria
//
// ✅ Puede importar: solo tipos de TypeScript
// ❌ NO puede importar: React, zustand, componentes, infrastructure
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

export const selectSetRol = (state: RolState): ((rol: Rol) => void) =>
  state.setRol
// Selector para obtener la función de cambio.
// Las funciones de Zustand son estables (referencia igual en cada render).
// Uso: const setRol = useRolStore(selectSetRol)
