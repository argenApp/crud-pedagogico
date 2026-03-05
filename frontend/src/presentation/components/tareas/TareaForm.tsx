// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: TareaForm
//
// Posición en la cadena de dependencias:
//   TareasPage → TareaForm → useCrearTarea() (Adapter)
//            → mutate(input) → CrearTarea.execute() → Domain → repo → HTTP POST
//
// Iron Law 1: Presentation NUNCA importa de Infrastructure.
// Iron Law 2: TODAS las escrituras pasan por UseCase (via el hook Adapter).
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Console: el primer log del flujo de escritura aparece en handleSubmit.
//   Network > Fetch/XHR: si el título es válido → POST aparece. Si inválido → NO hay POST.
//   React DevTools > Components > TareaForm > hooks: isPending=true mientras POST vuela.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

import {
  useCrearTarea,
  type CrearTareaInput,
} from '@/adapters/ui/hooks/useTareasMutations'
// Hook Portero: el componente importa TODO desde el hook — nunca salta a application/ ni domain/.
// El hook re-exporta los tipos necesarios → Iron Law 1 garantizado.


// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TareaFormProps {
  onTareaCreada?: () => void
}


// ─────────────────────────────────────────────────────────────────────────────
// El Componente
// ─────────────────────────────────────────────────────────────────────────────

export function TareaForm({ onTareaCreada }: TareaFormProps) {

  const [titulo, setTitulo]           = useState<string>('')
  const [errorLocal, setErrorLocal]   = useState<string>('')

  // ── Hook del Adapter ─────────────────────────────────────────────────────
  const { mutate, isPending } = useCrearTarea()
  // mutate    → llama al UseCase cuando el usuario envía el form.
  // isPending → true mientras el request HTTP está en vuelo.

  // ── Manejador del formulario ─────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 🔍 Console: agrega → console.log('[PRESENTATION] handleSubmit, titulo:', titulo.trim())
    // Primer punto del flujo de escritura. A partir de acá: ADAPTER → USE_CASE → DOMAIN → REPO

    setErrorLocal('')

    const input: CrearTareaInput = { titulo: titulo.trim() }

    mutate(input, {
      onSuccess: () => {
        setTitulo('')
        onTareaCreada?.()
      },
      onError: (error: Error) => {
        // 🔍 Console: error.message del Domain (sin POST en Network) o del repo (POST en rojo).
        setErrorLocal(error.message)
      },
    })
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Nueva tarea..."
        disabled={isPending}
        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="submit"
        disabled={isPending}
        // 🔍 React DevTools > TareaForm > hooks: isPending=true mientras POST vuela.
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Guardando...' : 'Agregar'}
      </button>

      {errorLocal && (
        <p className="text-red-500 text-sm mt-1">{errorLocal}</p>
      )}
    </form>
  )
}
