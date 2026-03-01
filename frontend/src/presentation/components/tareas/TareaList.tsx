// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: TareaList
//
// Muestra la lista de tareas. Maneja los estados de carga y error de useQuery.
// Delega el renderizado de cada fila a TareaItem.
// ═══════════════════════════════════════════════════════════════════════════════

import { useListarTareas, type TareaOutput } from '@/adapters/ui/hooks/useTareas'
import { TareaItem } from './TareaItem'
// Importamos desde la misma carpeta — ruta relativa sin "@/".


export function TareaList() {
  // Este componente no recibe props — obtiene todo desde el hook.

  const { data: tareas, isLoading, isError, error } = useListarTareas()
  // "useListarTareas()" devuelve un objeto de React Query. Destructuring:
  //
  //   data: tareas  → renombramos "data" a "tareas" para claridad.
  //                   Tipo: TareaOutput[] | undefined
  //                   "undefined" hasta que el query completa.
  //
  //   isLoading     → boolean. True mientras el primer fetch está en vuelo.
  //                   React Query lo maneja automáticamente.
  //
  //   isError       → boolean. True si el queryFn lanzó un Error.
  //
  //   error         → el objeto Error (si isError=true) o null.
  //                   TypeScript: tipo Error | null

  // ── Estados de la UI ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Cargando tareas...</p>
        {/* Podría ser un spinner. Para mantener el ejemplo simple, usamos texto. */}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-sm">Error al cargar las tareas: {error?.message}</p>
        {/* "error?.message" → optional chaining. Si error es null, devuelve undefined. */}
        {/* "?" en medio = si error es null/undefined, NO intenta acceder a .message */}
      </div>
    )
  }

  if (!tareas || tareas.length === 0) {
    // "!tareas" = true si tareas es undefined (antes de cargar).
    // "tareas.length === 0" = true si el array está vacío.
    // "||" = OR: se cumple si CUALQUIERA de las dos condiciones es true.
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No hay tareas todavía. ¡Agregá una!</p>
      </div>
    )
  }

  // ── Renderizado normal de la lista ────────────────────────────────────────────

  const pendientes  = tareas.filter((t: TareaOutput) => !t.completada)
  const completadas = tareas.filter((t: TareaOutput) => t.completada)
  // ".filter()" = método de array JavaScript. Devuelve un nuevo array
  // con solo los elementos que cumplen la condición.
  // "(t: TareaOutput)" → TypeScript: el parámetro de la arrow function es de tipo TareaOutput.
  //   ": TareaOutput" desaparece al compilar.
  // "!t.completada" = NOT. Solo incluye las que NO están completadas.

  return (
    <div className="space-y-4">
      {/* Sección de pendientes */}
      {pendientes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Pendientes ({pendientes.length})
            {/* "{pendientes.length}" → JS runtime. Muestra el número actual. */}
          </h2>
          <ul className="space-y-2">
            {pendientes.map((tarea: TareaOutput) => (
              // ".map()" = método de array. Transforma cada elemento en JSX.
              // Equivale a un bucle que devuelve un componente por cada tarea.
              // "(tarea: TareaOutput)" → TypeScript verifica el tipo. Desaparece al compilar.

              <TareaItem
                key={tarea.id}
                // "key" → prop especial de React (no TypeScript).
                // React lo usa internamente para identificar cada elemento de la lista.
                // Cuando cambia la lista, React sabe qué elementos agregar/quitar/actualizar.
                // DEBE ser único entre hermanos. Usamos el ID de la tarea.
                // Sin "key", React da warning y puede tener bugs de renderizado.

                tarea={tarea}
                // Pasamos la tarea al componente TareaItem.
                // TareaItem recibe: tarea: TareaOutput — TypeScript verifica que tenga todos los campos.
              />
            ))}
          </ul>
        </section>
      )}

      {/* Sección de completadas */}
      {completadas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Completadas ({completadas.length})
          </h2>
          <ul className="space-y-2">
            {completadas.map((tarea: TareaOutput) => (
              <TareaItem key={tarea.id} tarea={tarea} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
