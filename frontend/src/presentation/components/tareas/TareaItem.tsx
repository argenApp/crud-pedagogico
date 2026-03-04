// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: TareaItem
//
// Renderiza UNA tarea de la lista. Muestra sus datos y provee botones para
// actualizar (toggle completada) y eliminar.
//
// Este componente demuestra:
//   - onClick en botones
//   - Estado local de edición (input para editar el título)
//   - Uso de múltiples hooks del Adapter
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

import {
  useActualizarTarea,
  useEliminarTarea,
  type TareaOutput,
  type ActualizarTareaInput,
} from '@/adapters/ui/hooks/useTareasMutations'
// El componente importa TODO desde el hook de mutaciones — incluyendo los tipos re-exportados.
// "type TareaOutput" → TypeScript. Desaparece al compilar.
// "type ActualizarTareaInput" → TypeScript. Desaparece al compilar.


// ─────────────────────────────────────────────────────────────────────────────
// Props del componente
// ─────────────────────────────────────────────────────────────────────────────

interface TareaItemProps {
  tarea: TareaOutput
  // "tarea: TareaOutput" → TypeScript verifica que quien use TareaItem
  // le pase un TareaOutput completo (id, titulo, completada, creadaEn).
  // Si falta algún campo, TypeScript falla al programar.
}


// ─────────────────────────────────────────────────────────────────────────────
// El Componente
// ─────────────────────────────────────────────────────────────────────────────

export function TareaItem({ tarea }: TareaItemProps) {
  // Destructuring de props: extraemos "tarea" directamente.
  // Equivalente a: const tarea = props.tarea

  // ── Estado local del modo edición ───────────────────────────────────────────

  const [modoEdicion, setModoEdicion] = useState<boolean>(false)
  // Cuando modoEdicion=true → mostramos el input de edición.
  // Cuando modoEdicion=false → mostramos el texto del título.

  const [tituloEdicion, setTituloEdicion] = useState<string>(tarea.titulo)
  // El valor del input de edición. Inicializado con el título actual de la tarea.
  // "tarea.titulo" = acceso a propiedad del objeto. JavaScript runtime.

  const [errorLocal, setErrorLocal] = useState<string>('')

  // ── Hooks del Adapter ────────────────────────────────────────────────────────

  const { mutate: actualizar, isPending: actualizando } = useActualizarTarea()
  // "mutate: actualizar" → renombramos "mutate" a "actualizar" para claridad.
  // Si tuviéramos dos hooks con "mutate", necesitaríamos renombrar para evitar colisión.
  // Destructuring con renombre: { original: nuevo_nombre }

  const { mutate: eliminar, isPending: eliminando } = useEliminarTarea()

  const isPending = actualizando || eliminando
  // "||" = OR lógico. isPending es true si CUALQUIERA está en vuelo.
  // Deshabilitamos botones en ambos casos.

  // ── Manejadores de eventos ───────────────────────────────────────────────────

  const handleToggleCompletada = () => {
    // "handleToggleCompletada" = función que se llama al hacer click en el checkbox.
    // "Toggle" = alternar. Si está completa, la desmarca. Si no, la marca.

    const input: ActualizarTareaInput = {
      titulo:     tarea.titulo,
      // Mantenemos el mismo título — solo cambiamos "completada".
      completada: !tarea.completada,
      // "!" = NOT lógico. !true = false, !false = true.
      // Alterna el estado de completada.
    }

    actualizar({ id: tarea.id, input })
    // "actualizar" es la función "mutate" del hook renombrada.
    // Pasamos { id, input } — el hook espera exactamente ese objeto.
    // Si hay error (tarea no encontrada), onError del componente padre lo maneja.
  }

  const handleGuardarEdicion = () => {
    setErrorLocal('')

    const input: ActualizarTareaInput = {
      titulo:     tituloEdicion.trim(),
      completada: tarea.completada,
      // Mantenemos el estado actual de completada — solo cambiamos el título.
    }

    actualizar(
      { id: tarea.id, input },
      {
        onSuccess: () => {
          setModoEdicion(false)
          // Al guardar con éxito, salimos del modo edición.
          // El hook invalida el cache → la lista se refresca automáticamente.
        },
        onError: (error: Error) => {
          setErrorLocal(error.message)
        },
      }
    )
  }

  const handleCancelarEdicion = () => {
    setModoEdicion(false)
    setTituloEdicion(tarea.titulo)
    // Al cancelar: salimos del modo edición y restauramos el título original.
    setErrorLocal('')
  }

  const handleEliminar = () => {
    // Confirmación nativa del browser.
    if (!window.confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) return
    // "window.confirm" = diálogo de confirmación del browser (JavaScript nativo).
    // Devuelve true si el usuario hace click en "Aceptar", false si "Cancelar".
    // "return" sin valor sale de la función inmediatamente.

    eliminar(tarea.id)
    // "eliminar" es la función "mutate" del hook de eliminación.
    // TVariables = string → pasamos directamente el id.
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <li className={`flex items-center gap-3 p-3 rounded-lg border ${
      tarea.completada ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
      // Template literal en JSX: permite insertar expresiones JS dentro de strings.
      // Ternario: si completada → fondo gris, sino → fondo blanco.
    }`}>

      {/* Checkbox de completada */}
      <input
        type="checkbox"
        checked={tarea.completada}
        // "checked" = estado del checkbox. Controlado por React.
        // Si tarea.completada=true → checkbox marcado. Si false → desmarcado.

        onChange={handleToggleCompletada}
        // "onChange" en checkbox → se ejecuta al hacer click (marcar/desmarcar).
        // En inputs de texto, onChange se ejecuta por tecla. En checkbox, por click.

        disabled={isPending}
        className="w-4 h-4 cursor-pointer"
      />

      {/* Título o input de edición */}
      {modoEdicion ? (
        // Ternario en JSX: condición ? <JSX_si_true> : <JSX_si_false>
        // Si modoEdicion=true → mostramos el input. Sino → el texto.
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={tituloEdicion}
            onChange={(e) => setTituloEdicion(e.target.value)}
            // "e.target.value" = texto actual del input.
            // Cada letra que escribe el usuario actualiza "tituloEdicion" y dispara re-render.

            onKeyDown={(e) => {
              // "onKeyDown" = se ejecuta al presionar una tecla.
              if (e.key === 'Enter')  handleGuardarEdicion()
              // Enter → guarda
              if (e.key === 'Escape') handleCancelarEdicion()
              // Escape → cancela
            }}
            className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            // "autoFocus" → el input toma el foco automáticamente al aparecer.
            // El usuario puede empezar a escribir sin hacer click.
          />
          <button onClick={handleGuardarEdicion} disabled={isPending}
            className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50">
            ✓ Guardar
          </button>
          <button onClick={handleCancelarEdicion}
            className="text-gray-500 hover:text-gray-700 text-sm">
            ✕ Cancelar
          </button>
        </div>
      ) : (
        <span
          className={`flex-1 text-sm ${tarea.completada ? 'line-through text-gray-400' : 'text-gray-800'}`}
          // "line-through" = texto tachado (CSS text-decoration: line-through).
          // Se aplica solo cuando la tarea está completada.
        >
          {tarea.titulo}
          {/* "{tarea.titulo}" = acceso a propiedad. JavaScript runtime. */}
        </span>
      )}

      {/* Error de edición */}
      {errorLocal && (
        <span className="text-red-500 text-xs">{errorLocal}</span>
      )}

      {/* Botones de acción */}
      {!modoEdicion && (
        // "!modoEdicion" = NOT. Solo muestra los botones si NO está en modo edición.
        <div className="flex gap-1">
          <button
            onClick={() => setModoEdicion(true)}
            // "onClick" → se ejecuta al hacer click. Activa el modo edición.
            // "() => setModoEdicion(true)" = arrow function inline.
            // No pasamos (e) porque no necesitamos el evento.

            disabled={isPending}
            className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
          >
            Editar
          </button>
          <button
            onClick={handleEliminar}
            disabled={isPending}
            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
          >
            {eliminando ? '...' : 'Eliminar'}
          </button>
        </div>
      )}

      {/* Fecha de creación */}
      <span className="text-xs text-gray-400 shrink-0">
        {new Date(tarea.creadaEn).toLocaleDateString('es-AR')}
        {/* "new Date(string)" → convierte el string ISO 8601 a objeto Date de JS. */}
        {/* ".toLocaleDateString('es-AR')" → formatea la fecha en español argentino. */}
        {/* Ej: "2026-03-01T10:30:00+00:00" → "01/03/2026" */}
      </span>
    </li>
  )
}
