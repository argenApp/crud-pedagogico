// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hook de Estado de UI (Zustand / useFiltroTareas)
//
// ★ El hook ES el Adapter: conecta el mundo React (Presentation) con
//   el store de Zustand (Infrastructure), igual que useTareasQueries
//   conecta React con el UseCase+repo.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ este hook existe si el store ya es un hook?
//
//   infrastructure/state/stores/useFiltroTareasStore.ts
//   → Es la implementación concreta de Zustand.
//     Si mañana cambias Zustand por Jotai, solo cambia ESE archivo.
//
//   adapters/ui/hooks/useFiltroTareas.ts  ← ESTE ARCHIVO
//   → Es el "enchufe" que expone el estado al mundo Presentation.
//     El componente no sabe que hay un store de Zustand detrás.
//     Solo sabe que puede leer "filtro" y llamar "setFiltro".
//
// ─────────────────────────────────────────────────────────────────────────────
// ANALOGÍA con los otros adapters:
//
//   useTareasQueries   → adapta UseCase+repo    → para datos del SERVIDOR
//   useTareasMutations → adapta UseCase+repo    → para escrituras al SERVIDOR
//   useFiltroTareas    → adapta Zustand store   → para estado de UI (RAM)
//   ──────────────────────────────────────────────────────────────────────
//   Los tres viven en adapters/ui/hooks/ — son "enchufes" al mundo exterior.
//   Los tres son lo único que Presentation puede importar.
//
// ─────────────────────────────────────────────────────────────────────────────
// RECORRIDO:
//
//   Presentation (TareaList)
//     → useFiltroTareas()           [este adapter]
//       → useFiltroTareasStore()    [Zustand — Infrastructure]
//         → selectFiltro / selectSetFiltro  [selectores — Infrastructure]
//
// ✅ Puede importar: infrastructure/state (stores + selectors)
// ❌ NO puede importar: componentes .tsx, React Query
// ═══════════════════════════════════════════════════════════════════════════════

import { useFiltroTareasStore } from '@/infrastructure/state/stores/useFiltroTareasStore'
import {
  selectFiltro,
  selectSetFiltro,
} from '@/infrastructure/state/selectors/filtroTareasSelectors'


// ─────────────────────────────────────────────────────────────────────────────
// Re-export de tipos — el componente importa todo desde este hook
// ─────────────────────────────────────────────────────────────────────────────

export type { Filtro } from '@/infrastructure/state/stores/useFiltroTareasStore'
// El componente hace: import { useFiltroTareas, type Filtro } from './useFiltroTareas'
// No necesita saber que Filtro viene de infrastructure/ — lo obtiene del Adapter.


// ─────────────────────────────────────────────────────────────────────────────
// Hook de ESTADO DE UI
// ─────────────────────────────────────────────────────────────────────────────

export function useFiltroTareas() {
  const filtro    = useFiltroTareasStore(selectFiltro)
  // Zustand llama selectFiltro(state) y devuelve state.filtro.
  // Este componente re-renderiza SOLO cuando "filtro" cambia — no si
  // cambia otra parte del store. Esto es la optimización del selector.

  const setFiltro = useFiltroTareasStore(selectSetFiltro)
  // setFiltro es una función estable (no cambia entre renders).
  // Zustand garantiza que las funciones del store son referencias estables.

  return { filtro, setFiltro }
  // Retornamos un objeto plano.
  // El componente desestructura: const { filtro, setFiltro } = useFiltroTareas()
  // Si mañana agregamos más estado de filtro (ej: "búsqueda por texto"),
  // solo cambia este hook — ningún componente.
}
