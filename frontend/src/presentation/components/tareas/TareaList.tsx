// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: TareaList
//
// Posición en la cadena de dependencias:
//   TareasPage → TareaList → useListarTareas() (React Query, datos del servidor)
//                          → useFiltroTareasStore() (Zustand, filtro de UI)
//                          → .filter() (JS puro, sin HTTP)
//
// ★ Arquitectura de estado DUAL:
//   REACT QUERY → datos del servidor, ya filtrados por ROL en el UseCase
//   ZUSTAND     → filtro de tab activo (UI state, sin I/O)
//   Ambos se combinan con un simple .filter() — sin lógica especial.
//
// Regla de dependencias:
//   ✅ Puede importar: adapters/ui/hooks/, adapters/ui/state/
//   ❌ NO puede importar: repositorios, Use Cases, fetch, infrastructure
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   React DevTools > Components > TareaList:
//     hooks[0].data = tareas ya filtradas por ROL (React Query)
//     hooks Zustand: filtro activo ('todas'|'pendientes'|'completadas')
//   Network: NO hay request al cambiar el tab — solo .filter() en JS.
// ═══════════════════════════════════════════════════════════════════════════════

import { useListarTareas, type TareaOutputDTO } from '@/adapters/ui/hooks/useTareasQueries'
// React Query hook — provee los datos ya filtrados por ROL desde el UseCase.
// 🔍 React DevTools > TareaList > hooks: 'data' contiene solo lo que el UseCase permitió para el rol.

import { useFiltroTareasStore } from '@/adapters/ui/state/stores/useFiltroTareasStore'
import {
  selectFiltro,
  selectSetFiltro,
} from '@/adapters/ui/state/selectors/filtroTareasSelectors'
import type { Filtro } from '@/adapters/ui/state/stores/useFiltroTareasStore'
// Zustand store para el filtro de tab — estado de UI, sin I/O.
// Selectores granulares → re-renderiza solo si cambia filtro o setFiltro.

import { TareaItem } from './TareaItem'


// ─────────────────────────────────────────────────────────────────────────────
// Configuración de tabs
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { valor: Filtro; label: string }[] = [
  { valor: 'todas',       label: 'Todas'       },
  { valor: 'pendientes',  label: 'Pendientes'  },
  { valor: 'completadas', label: 'Completadas' },
]


export function TareaList() {

  // ── 1. REACT QUERY: datos del servidor (filtrados por ROL en UseCase) ────────
  const { data: tareas, isLoading, isError, error } = useListarTareas()
  // ADMIN recibe todas. VIEWER recibe solo las completadas.
  // Cache HIT (~5ms) o cache MISS → fetch (~200-500ms).

  // ── 2. ZUSTAND: filtro de tab (estado de UI, sin HTTP) ───────────────────────
  // 🔍 React DevTools: 'State' del store cambia al hacer click en tabs — sin request HTTP.
  const filtro    = useFiltroTareasStore(selectFiltro)
  const setFiltro = useFiltroTareasStore(selectSetFiltro)


  // ── Estados de carga y error ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Cargando tareas...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-sm">Error al cargar: {error?.message}</p>
      </div>
    )
  }

  // ── 3. FILTRADO: combina React Query (rol) + Zustand (tab) con JS puro ───────

  const todas       = tareas ?? []
  const pendientes  = todas.filter((t: TareaOutputDTO) => !t.completada)
  const completadas = todas.filter((t: TareaOutputDTO) =>  t.completada)
  // 🔍 Network: NO hay request acá. El filtro de tab es .filter() sobre datos ya en cache.

  const conteos: Record<Filtro, number> = {
    todas:       todas.length,
    pendientes:  pendientes.length,
    completadas: completadas.length,
  }

  const tareasFiltradas: TareaOutputDTO[] =
    filtro === 'todas'       ? todas       :
    filtro === 'pendientes'  ? pendientes  :
                               completadas
  // Zustand provee "filtro" → JS selecciona el array → React Query tenía los datos.


  // ── Renderizado ──────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ── TAB BAR — controlado por Zustand ─────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-4" role="tablist">
        {TABS.map(({ valor, label }) => {
          const estaActivo = filtro === valor
          // "filtro" viene de Zustand. Si coincide con este tab → estilos activos.

          return (
            <button
              key={valor}
              role="tab"
              aria-selected={estaActivo}
              onClick={() => setFiltro(valor)}
              // Flujo: click → setFiltro (Zustand) → re-render → tareasFiltradas actualizado
              // SIN nueva request HTTP.

              className={[
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                estaActivo
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {label}
              {' '}
              <span className={[
                'text-xs rounded-full px-1.5 py-0.5',
                estaActivo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {conteos[valor]}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── LISTA FILTRADA ────────────────────────────────────────────────── */}
      {tareasFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">
            {filtro === 'todas'
              ? 'No hay tareas todavía. ¡Agregá una!'
              : filtro === 'pendientes'
              ? 'No hay tareas pendientes.'
              : 'No hay tareas completadas.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tareasFiltradas.map((tarea: TareaOutputDTO) => (
            <TareaItem key={tarea.id} tarea={tarea} />
            // React Query proveyó los datos (filtrados por rol en UseCase).
            // Zustand filtró el tab. TareaItem renderiza cada una — no sabe nada de filtros.
          ))}
        </ul>
      )}

    </div>
  )
}
