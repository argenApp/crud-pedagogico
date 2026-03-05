// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Página: TareasPage
//
// Página raíz que compone los componentes TareaForm, TareaList y RolSwitcher.
// Una "Page" en Clean Architecture es un componente que representa una vista
// completa — combina sub-componentes y define el layout general.
// ═══════════════════════════════════════════════════════════════════════════════

import { TareaForm }    from '@/presentation/components/tareas/TareaForm'
import { TareaList }    from '@/presentation/components/tareas/TareaList'
import { RolSwitcher }  from '@/presentation/components/tareas/RolSwitcher'


export function TareasPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Encabezado */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Lista de Tareas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            CRUD Pedagógico — Clean Architecture con FastAPI + React + TypeScript
          </p>
        </header>

        {/* ── Simulador de rol ─────────────────────────────────────────────── */}
        <RolSwitcher />
        {/*
          RolSwitcher cambia el rol en Zustand.
          useListarTareas() lee ese rol y lo incluye en el queryKey.
          Cambiar el rol → queryKey nueva → React Query re-fetcha → UseCase aplica ReglaRol.
          TareaList recibe los datos ya filtrados — no sabe que existe un filtro por rol.
        */}

        {/* ── Formulario de nueva tarea ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">
            Nueva Tarea
          </h2>
          <TareaForm />
        </div>

        {/* ── Lista de tareas (filtrada por rol en el UseCase) ─────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <TareaList />
          {/*
            TareaList llama useListarTareas() → datos filtrados por rol.
            ADMIN: ve todas. VIEWER: ve solo completadas.
            La regla vive en Domain (ReglaRol) y la aplica el UseCase (ListarTareas).
          */}
        </div>

        {/* Pie de página pedagógico */}
        <footer className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p>
            Flujo escritura: onClick → mutate(input) → UseCase.execute() → Domain.validar() → repo → fetch POST
          </p>
          <p>
            Flujo lectura: rol cambia → queryKey nueva → UseCase.execute(rol) → ReglaRol.filtrar() → datos filtrados
          </p>
        </footer>

      </div>
    </main>
  )
}
