// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Página: TareasPage
//
// Página raíz que compone los componentes TareaForm y TareaList.
// Una "Page" en Clean Architecture es un componente que representa una vista
// completa — combina sub-componentes y define el layout general.
// ═══════════════════════════════════════════════════════════════════════════════

import { TareaForm } from '@/presentation/components/tareas/TareaForm'
import { TareaList } from '@/presentation/components/tareas/TareaList'
// Importamos los componentes hijos. La página los compone en la UI.


export function TareasPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      {/* <main> = elemento HTML semántico para el contenido principal de la página. */}
      {/* Tailwind: min-h-screen = altura mínima de la pantalla completa. */}
      {/*           bg-gray-100  = fondo gris claro. */}
      {/*           py-8 px-4    = padding vertical y horizontal. */}

      <div className="max-w-2xl mx-auto">
        {/* max-w-2xl = ancho máximo de 672px — evita que el contenido se estire. */}
        {/* mx-auto   = margen horizontal automático → centra el div. */}

        {/* Encabezado */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Lista de Tareas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            CRUD Pedagógico — Clean Architecture con FastAPI + React + TypeScript
          </p>
        </header>

        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">
            Nueva Tarea
          </h2>
          <TareaForm />
          {/* TareaForm no recibe props "onTareaCreada" — es opcional y lo omitimos. */}
          {/* Si quisiéramos hacer algo al crear (ej: navegar), pasaríamos el callback. */}
        </div>

        {/* Tarjeta de la lista */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <TareaList />
          {/* TareaList obtiene todo desde el hook (useListarTareas). */}
          {/* Cuando TareaForm crea una tarea, el hook invalida el cache */}
          {/* y TareaList se refresca automáticamente — sin comunicación directa */}
          {/* entre TareaForm y TareaList. React Query maneja la sincronización. */}
        </div>

        {/* Pie de página pedagógico */}
        <footer className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p>
            Flujo: onClick → handleSubmit → mutate(input) → UseCase.execute() → repo.crear() → fetch POST
          </p>
          <p>
            Retorno: JSON → _toEntity() → Promise&lt;Tarea&gt; → onSuccess → re-render
          </p>
          {/* "&lt;" y "&gt;" = entidades HTML para "&lt;" y "&gt;" en JSX. */}
          {/* En JSX, las llaves angulares pueden confundirse con JSX si no se escapan. */}
        </footer>
      </div>
    </main>
  )
}
