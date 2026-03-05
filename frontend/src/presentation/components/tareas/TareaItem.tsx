// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: TareaItem
//
// Posición en la cadena de dependencias:
//   TareaList → TareaItem → useActualizarTarea() / useEliminarTarea() (Adapters)
//            → mutate(...) → UseCases → Domain → repo → HTTP PUT/DELETE
//
// Renderiza 1 tarea. Demuestra múltiples hooks de mutación en un mismo componente.
// Iron Law 1: Presentation NUNCA importa de Infrastructure.
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   React DevTools > Components > TareaItem > hooks: isPending=true durante PUT/DELETE en vuelo.
//   Network: PUT /api/v1/tareas/{id} al hacer toggle o guardar edición.
//           DELETE /api/v1/tareas/{id} al eliminar → status 204 sin body.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

import {
  useActualizarTarea,
  useEliminarTarea,
  type TareaOutputDTO,
  type ActualizarTareaInput,
} from '@/adapters/ui/hooks/useTareasMutations'
// Hook Portero: el componente importa TODO desde el hook — incluyendo los tipos re-exportados.
// Presentation nunca salta a domain/ ni infrastructure/ directamente.


// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TareaItemProps {
  tarea: TareaOutputDTO
}


// ─────────────────────────────────────────────────────────────────────────────
// El Componente
// ─────────────────────────────────────────────────────────────────────────────

export function TareaItem({ tarea }: TareaItemProps) {

  // ── Estado local del modo edición ───────────────────────────────────────────
  const [modoEdicion,   setModoEdicion]   = useState<boolean>(false)
  const [tituloEdicion, setTituloEdicion] = useState<string>(tarea.titulo)
  const [errorLocal,    setErrorLocal]    = useState<string>('')

  // ── Hooks del Adapter ────────────────────────────────────────────────────────
  const { mutate: actualizar, isPending: actualizando } = useActualizarTarea()
  // Renombramos "mutate" → "actualizar" para evitar colisión con el hook de eliminación.
  // 🔍 React DevTools: isPending=true mientras el PUT está en vuelo → botones deshabilitados.

  const { mutate: eliminar, isPending: eliminando } = useEliminarTarea()

  const isPending = actualizando || eliminando
  // Deshabilitamos botones si CUALQUIER mutación está en vuelo.

  // ── Manejadores ──────────────────────────────────────────────────────────────

  const handleToggleCompletada = () => {
    const input: ActualizarTareaInput = {
      titulo:     tarea.titulo,
      completada: !tarea.completada,
    }
    // 🔍 Network: PUT /api/v1/tareas/{id} con { titulo, completada: !tarea.completada }
    actualizar({ id: tarea.id, input })
  }

  const handleGuardarEdicion = () => {
    setErrorLocal('')
    const input: ActualizarTareaInput = {
      titulo:     tituloEdicion.trim(),
      completada: tarea.completada,
    }
    actualizar(
      { id: tarea.id, input },
      {
        onSuccess: () => setModoEdicion(false),
        onError: (error: Error) => {
          // 🔍 Domain rechazó el título → error sin POST en Network.
          //    Backend falló → error HTTP → POST en Network en rojo.
          setErrorLocal(error.message)
        },
      }
    )
  }

  const handleCancelarEdicion = () => {
    setModoEdicion(false)
    setTituloEdicion(tarea.titulo)
    setErrorLocal('')
  }

  const handleEliminar = () => {
    if (!window.confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) return
    // 🔍 Network: DELETE /api/v1/tareas/{id} → status 204 sin body.
    eliminar(tarea.id)
  }

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <li className={`flex items-center gap-3 p-3 rounded-lg border ${
      tarea.completada ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
    }`}>

      {/* Checkbox de completada */}
      <input
        type="checkbox"
        checked={tarea.completada}
        onChange={handleToggleCompletada}
        // 🔍 React DevTools: isPending=true después del click mientras PUT está en vuelo.
        disabled={isPending}
        className="w-4 h-4 cursor-pointer"
      />

      {/* Título o input de edición */}
      {modoEdicion ? (
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={tituloEdicion}
            onChange={(e) => setTituloEdicion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  handleGuardarEdicion()
              if (e.key === 'Escape') handleCancelarEdicion()
            }}
            className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
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
        >
          {tarea.titulo}
        </span>
      )}

      {/* Error de edición */}
      {errorLocal && (
        <span className="text-red-500 text-xs">{errorLocal}</span>
      )}

      {/* Botones de acción */}
      {!modoEdicion && (
        <div className="flex gap-1">
          <button
            onClick={() => setModoEdicion(true)}
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
      </span>
    </li>
  )
}
