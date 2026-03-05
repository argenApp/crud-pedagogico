// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: RolSwitcher
//
// Simula el cambio de usuario/rol para demostrar las reglas de negocio
// del UseCase en operaciones de LECTURA (GET).
//
// ─────────────────────────────────────────────────────────────────────────────
// PROPÓSITO PEDAGÓGICO:
//
//   Al cambiar de rol, el componente TareaList muestra datos distintos
//   SIN que el usuario haya hecho ningún filtro manual.
//
//   ¿Por qué? Porque:
//   1. Zustand actualiza: rol = 'VIEWER'
//   2. useListarTareas() detecta el cambio (rol está en el queryKey)
//   3. React Query hace un nuevo fetch: queryKey ['tareas', 'VIEWER']
//   4. useCase.execute('VIEWER') → ReglaRol.filtrarPorRol() → solo completadas
//   5. TareaList re-renderiza con los datos filtrados por el UseCase
//
//   Demostración en vivo de por qué los GET pasan por el UseCase.
//
// ✅ Puede importar: adapters/ui/state/ (stores + selectors)
// ❌ NO puede importar: repositorios, Use Cases, fetch, infrastructure
// ═══════════════════════════════════════════════════════════════════════════════

import { useRolStore }  from '@/adapters/ui/state/stores/useRolStore'
import { selectRol, selectSetRol } from '@/adapters/ui/state/selectors/rolSelectors'
import type { Rol } from '@/domain/roles/Rol'
// "import type" → TypeScript puro, desaparece al compilar.
// El componente conoce el vocabulario de Domain (Rol) pero no lo instancia.


// ─────────────────────────────────────────────────────────────────────────────
// Configuración de los roles para el UI
// ─────────────────────────────────────────────────────────────────────────────

interface ConfigRol {
  valor:       Rol
  label:       string
  descripcion: string
  color:       string
  colorActivo: string
}

const ROLES: ConfigRol[] = [
  {
    valor:       'ADMIN',
    label:       '👤 ADMIN',
    descripcion: 'Ve todas las tareas (pendientes + completadas)',
    color:       'border-transparent text-gray-500 hover:text-gray-700',
    colorActivo: 'border-blue-500 text-blue-600 bg-blue-50',
  },
  {
    valor:       'VIEWER',
    label:       '👁 VIEWER',
    descripcion: 'Solo ve tareas completadas (regla de negocio del UseCase)',
    color:       'border-transparent text-gray-500 hover:text-gray-700',
    colorActivo: 'border-amber-500 text-amber-600 bg-amber-50',
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// El Componente
// ─────────────────────────────────────────────────────────────────────────────

export function RolSwitcher() {
  const rol    = useRolStore(selectRol)
  const setRol = useRolStore(selectSetRol)
  // Selectores granulares → re-renderiza solo si cambia "rol" o "setRol".

  const configActual = ROLES.find((r) => r.valor === rol)!
  // Encontramos la configuración del rol activo para mostrar su descripción.

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">

      {/* Título explicativo */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Simulación de rol
        </span>
        <span className="text-xs text-gray-400">
          — demuestra las reglas de negocio del UseCase en lecturas (GET)
        </span>
      </div>

      {/* Botones de selección de rol */}
      <div className="flex gap-2 mb-3">
        {ROLES.map((config) => {
          const estaActivo = rol === config.valor

          return (
            <button
              key={config.valor}
              onClick={() => setRol(config.valor)}
              // onClick → setRol → Zustand → queryKey cambia → React Query re-fetch
              // → UseCase.execute(nuevoRol) → ReglaRol.filtrarPorRol() → UI actualizada

              className={[
                'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                estaActivo ? config.colorActivo : config.color,
              ].join(' ')}
            >
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Descripción de la regla activa */}
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
        <span className="font-semibold">Regla activa:</span>{' '}
        {configActual.descripcion}
      </div>

      {/* Explicación del flujo */}
      <div className="mt-2 text-xs text-gray-400 font-mono">
        Zustand(rol) → queryKey[&apos;tareas&apos;, &apos;{rol}&apos;] → UseCase.execute(&apos;{rol}&apos;) → ReglaRol.filtrarPorRol()
      </div>
    </div>
  )
}
