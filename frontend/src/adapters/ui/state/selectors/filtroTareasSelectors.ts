// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — State Selectors: Filtro de Tareas
//
// Posición en la cadena de dependencias:
//   Presentation → useFiltroTareasStore(selectFiltro) → [filtro actual]
//   Los selectores son funciones puras — no son hooks, no tienen estado propio.
//
// ★ Este archivo contiene SELECTORES del store de filtro de tareas.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿QUÉ ES UN SELECTOR?
//
// Un selector es una función que "selecciona" una parte del estado del store.
// En Zustand se pasa como argumento al hook del store:
//
//   const filtro = useFiltroTareasStore(selectFiltro)
//   //                                  ↑ selector
//
// Sin selector (desestructuración):
//   const { filtro, setFiltro } = useFiltroTareasStore()
//   ← El componente re-renderiza si CUALQUIER parte del store cambia.
//      Si el store tuviera 10 propiedades y cambia otra, este componente
//      se re-renderiza innecesariamente.
//
// Con selector:
//   const filtro = useFiltroTareasStore(selectFiltro)
//   ← El componente re-renderiza SOLO si "filtro" cambia.
//      Si cambia otra parte del store → no re-renderiza. Más eficiente.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ están en adapters/ui/state/selectors/ y no en el store?
//
//   Store    → define QUÉ existe en el estado (estado + acciones)
//   Selector → define CÓMO leer partes del estado de forma eficiente
//
//   Separar permite:
//   → Reutilizar el mismo selector en múltiples hooks o componentes
//   → Un solo lugar para buscar "cómo se lee X del store"
//   → El store no crece con lógica de lectura — solo tiene estado y acciones
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ también hay selectores para las ACCIONES (setFiltro)?
//
//   Las acciones también son parte del estado de Zustand.
//   Usar selector para acciones garantiza que el componente no re-renderice
//   si la acción cambia (aunque en Zustand las acciones son estables — misma
//   referencia en cada render).
//   Es buena práctica mantener consistencia: TODO se lee con selectores.
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: tipos del store (FiltroTareasStore, Filtro)
//   ❌ NO puede importar: React, componentes, repositorios, React Query
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   React DevTools > Profiler: con selectores, el componente solo re-renderiza
//   cuando su slice específica del store cambia (no el store completo).
//   En una app grande, esto evita re-renders en cascada innecesarios.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Filtro } from '@/adapters/ui/state/stores/useFiltroTareasStore'
// Importamos solo el TIPO — TypeScript puro, desaparece al compilar.
// Necesitamos Filtro para tipar el parámetro de retorno del selector.


// ─────────────────────────────────────────────────────────────────────────────
// Tipo del estado del store — necesario para tipar los selectores
// ─────────────────────────────────────────────────────────────────────────────

interface FiltroState {
  filtro:    Filtro
  setFiltro: (filtro: Filtro) => void
}
// "interface" = TypeScript puro. Refleja la forma del store.
// Los selectores reciben el estado completo y devuelven una parte.
// "FiltroState" describe ese estado completo.


// ─────────────────────────────────────────────────────────────────────────────
// Selectores
// ─────────────────────────────────────────────────────────────────────────────

export const selectFiltro = (state: FiltroState): Filtro =>
  state.filtro
// "selectFiltro" = función que recibe el estado del store y devuelve solo "filtro".
//
// Tipo: (state: FiltroState) => Filtro
//   state: FiltroState → el estado completo del store (Zustand lo inyecta)
//   : Filtro           → TypeScript: lo que devuelve ('todas' | 'pendientes' | 'completadas')
//
// Uso: const filtro = useFiltroTareasStore(selectFiltro)
//   → Zustand llama selectFiltro(state) y devuelve state.filtro
//   → Re-renderiza SOLO cuando filtro cambia


export const selectSetFiltro = (state: FiltroState): ((filtro: Filtro) => void) =>
  state.setFiltro
// "selectSetFiltro" = función que devuelve la acción setFiltro del store.
//
// ¿Por qué poner una acción en un selector?
//   Las acciones también son parte del estado de Zustand.
//   Usar selector para acciones garantiza que el componente no re-renderice
//   si la acción cambia (aunque en Zustand las acciones no cambian — son estables).
//   Es buena práctica para mantener consistencia: TODO se lee con selectores.
//
// Uso: const setFiltro = useFiltroTareasStore(selectSetFiltro)
//   → setFiltro('pendientes') cambia el estado en el store
