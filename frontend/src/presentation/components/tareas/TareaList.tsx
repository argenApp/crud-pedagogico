// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: TareaList
//
// ★ Este componente demuestra la ARQUITECTURA DE ESTADO DUAL:
//
//   REACT QUERY → provee los datos del servidor (lista de tareas)
//   ZUSTAND     → provee el estado de UI (qué tab/filtro está activo)
//
// ─────────────────────────────────────────────────────────────────────────────
// CÓMO CONVIVEN ZUSTAND Y REACT QUERY EN ESTE COMPONENTE:
//
//   ┌─────────────────────────────────────────────────────────────────┐
//   │                     TareaList (este componente)                 │
//   │                                                                 │
//   │  useListarTareas()          useFiltroTareasStore()              │
//   │  ↓ React Query              ↓ Zustand                          │
//   │  tareas: TareaOutput[]      filtro: 'todas'|'pendientes'|...   │
//   │  (del backend, cacheado)    (en RAM, sin HTTP)                  │
//   │                                                                 │
//   │  tareasFiltradas = tareas.filter(según filtro)                  │
//   │  ↑ JS puro — combina los dos mundos sin lógica especial         │
//   └─────────────────────────────────────────────────────────────────┘
//
// React Query NO sabe qué filtro está activo.
// Zustand NO sabe qué tareas hay.
// Este componente los une con un simple .filter().
//
// ─────────────────────────────────────────────────────────────────────────────
// FLUJO CUANDO EL USUARIO HACE CLICK EN UN TAB:
//
//   1. onClick → setFiltro('pendientes')
//   2. Zustand actualiza: { filtro: 'pendientes' }
//   3. TareaList re-renderiza (Zustand notifica el cambio)
//   4. tareasFiltradas = tareas.filter(t => !t.completada)
//   5. UI muestra solo las tareas pendientes
//   ⚡ Sin fetch HTTP — los datos ya están en el cache de React Query
//   ⚡ Sin useState — Zustand maneja el estado del tab
//
// ✅ Puede importar: hooks (Adapters), stores (Infrastructure/state)
// ❌ NO puede importar: repositorios, Use Cases, fetch
// ═══════════════════════════════════════════════════════════════════════════════

import { useListarTareas, type TareaOutput } from '@/adapters/ui/hooks/useTareas'
// React Query hook — provee los datos del servidor.
// "type TareaOutput" → TypeScript: importamos solo el tipo (desaparece al compilar).

import {
  useFiltroTareasStore,
  type Filtro,
} from '@/infrastructure/state/stores/useFiltroTareasStore'
// Zustand store — provee el estado de UI (tab activo).
// "type Filtro" → TypeScript: 'todas' | 'pendientes' | 'completadas'
//
// ¿Por qué importamos el store directamente y no desde el hook (useTareas.ts)?
//   El store es estado de UI propio de este componente — no es un dato del servidor.
//   El patrón "Hook Portero" aplica para datos del servidor (React Query).
//   Para estado de UI (Zustand), los componentes importan el store directamente.

import { TareaItem } from './TareaItem'


// ─────────────────────────────────────────────────────────────────────────────
// Configuración de los tabs
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { valor: Filtro; label: string }[] = [
  // "const TABS" = array JavaScript constante — existe en runtime.
  // "{ valor: Filtro; label: string }[]" → TypeScript: array de objetos con esa forma.
  // Definir los tabs como array de datos (no como JSX hardcodeado) permite
  // renderizarlos con .map() sin repetir código.

  { valor: 'todas',       label: 'Todas'       },
  { valor: 'pendientes',  label: 'Pendientes'  },
  { valor: 'completadas', label: 'Completadas' },
]


export function TareaList() {

  // ── 1. REACT QUERY: datos del servidor ──────────────────────────────────────
  const { data: tareas, isLoading, isError, error } = useListarTareas()
  // "useListarTareas()" → React Query.
  // Devuelve los datos cacheados (HIT, ~5ms) o hace fetch (MISS, ~200-500ms).
  // "data: tareas" → renombramos "data" a "tareas" para claridad en este archivo.
  // Tipo: TareaOutput[] | undefined  ("undefined" mientras carga la primera vez)

  // ── 2. ZUSTAND: estado de UI ─────────────────────────────────────────────────
  const { filtro, setFiltro } = useFiltroTareasStore()
  // "useFiltroTareasStore()" → Zustand.
  // Devuelve el estado actual del store y las acciones para modificarlo.
  //
  // "filtro"    → el tab actualmente activo ('todas' | 'pendientes' | 'completadas')
  //               Empieza en 'todas' (valor inicial del store).
  //
  // "setFiltro" → función para cambiar el tab activo.
  //               Cuando se llama, Zustand actualiza el estado y
  //               React re-renderiza este componente automáticamente.
  //
  // ¿Cuándo re-renderiza?
  //   Con React Query: cuando los datos del servidor cambian (nuevo fetch).
  //   Con Zustand: cuando el filtro cambia (click en tab).
  //   Son independientes — cada uno dispara su propio re-render.


  // ── Estados de carga y error (React Query) ───────────────────────────────────

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

  // ── 3. FILTRADO: combina Zustand + React Query con JS puro ───────────────────

  const todas       = tareas ?? []
  // "??" = nullish coalescing operator (JavaScript).
  // Si "tareas" es undefined o null → devuelve [] (array vacío).
  // Si "tareas" tiene valor → devuelve ese valor.
  // Necesario porque "data" de useQuery es TareaOutput[] | undefined.

  const pendientes  = todas.filter((t: TareaOutput) => !t.completada)
  const completadas = todas.filter((t: TareaOutput) =>  t.completada)
  // ".filter()" = método de array JavaScript. No modifica "todas" — devuelve un nuevo array.
  // "!t.completada" = tareas que NO están completadas (pendientes).
  // " t.completada" = tareas que SÍ están completadas.

  const conteos: Record<Filtro, number> = {
    // "Record<Filtro, number>" = TypeScript: objeto donde las claves son Filtro
    // y los valores son numbers. Equivale a:
    // { todas: number; pendientes: number; completadas: number }
    todas:       todas.length,
    pendientes:  pendientes.length,
    completadas: completadas.length,
  }
  // conteos se usa para mostrar "(3)" al lado del label de cada tab.

  const tareasFiltradas: TareaOutput[] =
    filtro === 'todas'       ? todas       :
    filtro === 'pendientes'  ? pendientes  :
                               completadas
  // Operador ternario encadenado: selecciona el array según el filtro activo.
  // Zustand provee "filtro" → JS selecciona el array → React Query tenía los datos.
  // ¡Los dos mundos se unen aquí en una sola línea!
  //
  // Equivalente más explícito:
  //   if (filtro === 'todas')       return todas
  //   if (filtro === 'pendientes')  return pendientes
  //   return completadas


  // ── Renderizado ──────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ── TAB BAR — controlado por Zustand ─────────────────────────────── */}
      <div
        className="flex border-b border-gray-200 mb-4"
        role="tablist"
        // "role='tablist'" = accesibilidad HTML. Le dice al lector de pantalla
        // que este div es una barra de tabs.
      >
        {TABS.map(({ valor, label }) => {
          // ".map()" recorre el array TABS y devuelve un <button> por cada tab.
          // "{ valor, label }" = destructuring del objeto { valor: 'todas', label: 'Todas' }.

          const estaActivo = filtro === valor
          // "filtro" viene de Zustand. "valor" es el valor de este tab.
          // Si coinciden → este tab está activo → aplicamos estilos distintos.
          // "===" = igualdad estricta en JavaScript (tipo + valor deben coincidir).

          return (
            <button
              key={valor}
              // "key" → prop especial de React para identificar elementos en listas.
              // Debe ser único entre hermanos.

              role="tab"
              aria-selected={estaActivo}
              // "aria-selected" = accesibilidad: indica al lector de pantalla
              // si este tab está seleccionado.

              onClick={() => setFiltro(valor)}
              // "onClick" → se ejecuta cuando el usuario hace click.
              // "() => setFiltro(valor)" → arrow function que llama a Zustand.
              //
              // Flujo:
              //   Click en "Pendientes"
              //   → setFiltro('pendientes')  [Zustand]
              //   → store actualiza: { filtro: 'pendientes' }
              //   → TareaList re-renderiza
              //   → estaActivo = true para el tab 'pendientes'
              //   → tareasFiltradas = pendientes[]
              //   → UI muestra solo pendientes

              className={[
                // "className" en React = el atributo "class" de HTML.
                // En JSX se llama "className" porque "class" es palabra reservada en JS.

                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                // Clases Tailwind comunes a todos los tabs:
                // px-4 py-2 = padding. text-sm = tamaño de texto.
                // border-b-2 = borde inferior. transition-colors = transición suave.

                estaActivo
                  ? 'border-blue-500 text-blue-600'
                  // Tab activo: borde azul + texto azul.
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  // Tab inactivo: borde transparente, texto gris.
                  // "hover:" = estilos que se aplican al pasar el mouse (Tailwind).
              ].join(' ')}
              // ".join(' ')" = une el array de strings en uno separado por espacios.
              // Resultado: "px-4 py-2 ... border-blue-500 text-blue-600"
            >
              {label}
              {' '}
              <span className={[
                'text-xs rounded-full px-1.5 py-0.5',
                estaActivo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {conteos[valor]}
                {/* Muestra el número de tareas de este tab: (3), (2), etc. */}
                {/* "conteos[valor]" → acceso a objeto con clave dinámica. */}
                {/* TypeScript: Record<Filtro, number> garantiza que valor sea una clave válida. */}
              </span>
            </button>
          )
        })}
      </div>
      {/* ── FIN TAB BAR ──────────────────────────────────────────────────── */}


      {/* ── LISTA FILTRADA — datos de React Query, filtro de Zustand ──────── */}
      {tareasFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">
            {filtro === 'todas'
              ? 'No hay tareas todavía. ¡Agregá una!'
              : filtro === 'pendientes'
              ? 'No hay tareas pendientes.'
              : 'No hay tareas completadas.'}
          </p>
          {/* Mensaje contextual según el filtro activo (Zustand). */}
        </div>
      ) : (
        <ul className="space-y-2">
          {tareasFiltradas.map((tarea: TareaOutput) => (
            <TareaItem key={tarea.id} tarea={tarea} />
            // React Query proveyó los datos. Zustand filtró cuáles mostrar.
            // TareaItem renderiza cada una — no sabe nada de filtros ni cache.
          ))}
        </ul>
      )}

    </div>
  )
}
