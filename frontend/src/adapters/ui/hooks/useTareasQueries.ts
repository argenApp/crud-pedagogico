// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Hook de Lectura (React Query / useQuery)
//
// ★ El hook ES el Adapter: conecta el mundo React con la capa de Application.
//   "Enchufado" = instancia el repo (Infrastructure) + el UseCase (Application)
//   y los conecta con el sistema de cache de React Query.
//
// ─────────────────────────────────────────────────────────────────────────────
// RECORRIDO DE CAPAS (lectura con control de acceso por rol):
//
//   Presentation → Adapter (este hook)
//              → Zustand (selectRol) → obtiene el rol activo
//              → UseCase.execute(rol) → ReglaRol.filtrarPorRol()
//              → Infrastructure (repo.listar()) → HTTP GET
//              → datos filtrados según el rol → cache → UI
//
// ─────────────────────────────────────────────────────────────────────────────
// ★ PUNTO CLAVE: el queryKey incluye el rol
//
//   queryKey: ['tareas', 'ADMIN']   ← cache separado para ADMIN
//   queryKey: ['tareas', 'VIEWER']  ← cache separado para VIEWER
//
//   Cuando el rol cambia → nueva queryKey → React Query hace un nuevo fetch
//   automáticamente. Sin el rol en la queryKey, un cambio de rol NO dispararía
//   un re-fetch y el usuario VIEWER podría ver datos de ADMIN cacheados.
//
// ✅ Puede importar: infrastructure (repos), application (use cases), domain (tipos)
// ❌ NO puede importar: componentes .tsx, stores de Zustand (excepto para leer rol)
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query'
import { TareaRepositoryImpl } from '@/infrastructure/repositories/TareaRepositoryImpl'
import { ListarTareas } from '@/application/useCases/Tareas/ListarTareas'
import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
import { useRolStore } from '@/adapters/ui/state/stores/useRolStore'
import { selectRol } from '@/adapters/ui/state/selectors/rolSelectors'


// ─────────────────────────────────────────────────────────────────────────────
// Query Keys — estructura de claves del cache
// ─────────────────────────────────────────────────────────────────────────────

export const TAREAS_BASE_KEY = ['tareas'] as const
// TAREAS_BASE_KEY = la raíz de la clave, usada por las MUTACIONES para invalidar.
// "invalidateQueries({ queryKey: ['tareas'] })" invalida TODAS las variantes:
//   ['tareas', 'ADMIN'] y ['tareas', 'VIEWER'] — ambas de una sola vez.
//
// Exportada desde Queries porque la "dueña" de la estructura de keys es la lectura.
// Las mutaciones la importan para saber qué invalidar al escribir.

export const tareasQueryKey = (rol: string) => [...TAREAS_BASE_KEY, rol] as const
// "tareasQueryKey('ADMIN')" → ['tareas', 'ADMIN']
// "tareasQueryKey('VIEWER')" → ['tareas', 'VIEWER']
//
// El rol en la queryKey garantiza que:
//   1. ADMIN y VIEWER tienen caches SEPARADOS e independientes.
//   2. Cambiar de rol dispara un nuevo fetch automáticamente.
//   3. Los datos de un rol nunca "contaminan" el cache del otro.


// ─────────────────────────────────────────────────────────────────────────────
// Re-export de tipos — el componente importa todo desde este hook
// ─────────────────────────────────────────────────────────────────────────────

export type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// Hook Portero: el componente hace:
// import { useListarTareas, type TareaOutputDTO } from './useTareasQueries'
// No necesita saber que TareaOutputDTO viene de domain/ — lo obtiene del Adapter.


// ─────────────────────────────────────────────────────────────────────────────
// Hook de LECTURA con control de acceso por rol
// ─────────────────────────────────────────────────────────────────────────────

export function useListarTareas() {
  // ── Lee el rol activo desde Zustand ────────────────────────────────────────
  const rol = useRolStore(selectRol)
  // "selectRol" es un selector → este hook re-renderiza SOLO si "rol" cambia.
  // Cuando el usuario cambia de ADMIN a VIEWER:
  //   1. Zustand actualiza: rol = 'VIEWER'
  //   2. useRolStore(selectRol) devuelve 'VIEWER'
  //   3. Este componente re-renderiza
  //   4. queryKey cambia: ['tareas', 'VIEWER']
  //   5. React Query detecta queryKey nueva → fetch automático

  return useQuery<TareaOutputDTO[], Error>({
    queryKey: tareasQueryKey(rol),
    // "tareasQueryKey(rol)" → ['tareas', 'ADMIN'] o ['tareas', 'VIEWER']
    // Si el rol cambia → la queryKey cambia → nuevo fetch → nuevos datos filtrados.
    // Sin el rol en la queryKey, el cambio de rol NO dispararía re-fetch.

    queryFn: async () => {
      // Cache MISS: instanciamos el repo y llamamos al UseCase con el rol actual.
      const repo    = new TareaRepositoryImpl()
      const useCase = new ListarTareas(repo)
      return useCase.execute(rol)
      // El UseCase recibe el rol y aplica ReglaRol.filtrarPorRol():
      //   ADMIN  → todas las tareas
      //   VIEWER → solo las completadas
      //
      // El componente NO sabe del filtrado — recibe los datos ya filtrados.
      // El repo NO sabe del filtrado — devuelve todos los datos siempre.
      // SOLO el UseCase + Domain saben qué datos corresponden a cada rol.
    },
  })
}
