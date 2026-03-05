// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: DOMAIN — Roles y Reglas de Visibilidad
//
// Posición en la cadena de dependencias:
//   Zustand (useRolStore) → Adapter (useTareasQueries) → UseCase (ListarTareas)
//   → ReglaRol.filtrarPorRol() ← ESTE ARCHIVO define esa regla
//
// Define las reglas de QUIÉN puede ver QUÉ.
// El UseCase (ListarTareas) lo consulta antes de devolver datos.
//
// ¿Por qué los GET pasan por el UseCase?
// ─────────────────────────────────────────────────────────────────────────────
//   Porque el UseCase aplica REGLAS DE NEGOCIO sobre QUÉ puede ver cada rol.
//   Si el Adapter llamara al repo directamente, estas reglas nunca se aplicarían:
//
//   ❌ SIN UseCase:  queryFn → repo.listar() → todos los datos (siempre)
//   ✅ CON UseCase:  queryFn → UseCase.execute(rol) → ReglaRol.filtrar() → datos filtrados
//
// Este archivo define:
//   1. Rol        → qué roles existen en el sistema
//   2. ReglaRol   → la REGLA DE NEGOCIO que determina qué ve cada rol
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: NADA externo. Es TypeScript puro.
//   ❌ NO puede importar: React, fetch, TanStack, nada de Infrastructure.
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Console: agrega console.log('[DOMAIN] ReglaRol.filtrarPorRol:', rol, 'total:', tareas.length)
//   dentro de filtrarPorRol para ver el filtrado en acción.
//   ADMIN recibirá N items. VIEWER recibirá solo los completados.
// ═══════════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
// Tipo: Rol
// ─────────────────────────────────────────────────────────────────────────────

export type Rol = 'ADMIN' | 'VIEWER'
// "type" en TypeScript = alias de tipo. Desaparece al compilar.
// Solo puede valer uno de esos dos strings — TypeScript falla si ponés otro.
//
// ADMIN  → tiene acceso completo (ve todas las tareas)
// VIEWER → acceso de solo-lectura limitado (ve solo tareas completadas)
//
// En producción real, este valor vendría de un token JWT verificado
// por el backend. Acá lo simulamos con Zustand para fines pedagógicos.


// ─────────────────────────────────────────────────────────────────────────────
// Clase: ReglaRol — la regla de negocio de visibilidad
// ─────────────────────────────────────────────────────────────────────────────

export class ReglaRol {
  // "ReglaRol" encapsula TODAS las reglas relacionadas a qué puede ver cada rol.
  // Vivir en Domain garantiza que:
  //   - La regla es reutilizable (cualquier UseCase puede llamarla)
  //   - La regla es testeable en aislamiento (sin React, sin HTTP)
  //   - La regla tiene UN solo lugar donde cambia (Single Responsibility)
  //
  // Analogía: es el "reglamento" del sistema. El UseCase lo consulta
  // antes de devolver datos al Adapter.

  static puedeVerTareasPendientes(rol: Rol): boolean {
    // ¿Este rol puede ver tareas que NO están completadas?
    // ADMIN: sí. VIEWER: no.
    return rol === 'ADMIN'
  }

  static filtrarPorRol<T extends { completada: boolean }>(
    tareas: T[],
    rol: Rol
  ): T[] {
    // "filtrarPorRol" aplica la regla de visibilidad a un array de datos.
    //
    // "<T extends { completada: boolean }>" = generic con constraint.
    //   T puede ser TareaOutputDTO o cualquier tipo que tenga "completada".
    //   Hace que esta función sea reutilizable para cualquier entidad similar.
    //
    // Regla de negocio:
    //   ADMIN  → ve TODAS las tareas (sin filtro)
    //   VIEWER → ve SOLO las tareas completadas
    //
    // ¿Dónde se aplica esta regla?
    //   En ListarTareas.execute() — el UseCase de Application.
    //   NUNCA en el repositorio (el repo no sabe de roles).
    //   NUNCA en el componente (el componente no decide qué datos son válidos).

    // 🔍 Console: pon console.log('[DOMAIN] ReglaRol.filtrarPorRol:', rol, tareas.length)
    // aquí → verás que ADMIN recibe N items, VIEWER recibe solo los completados.
    // Si hay 5 tareas y 2 completadas: ADMIN ve 5, VIEWER ve 2.

    if (rol === 'ADMIN') {
      return tareas
      // ADMIN recibe todos los datos tal como los devuelve el repositorio.
      // "return tareas" devuelve la referencia al mismo array (no copia).
    }

    // VIEWER: solo tareas completadas
    return tareas.filter((t) => t.completada)
    // ".filter()" devuelve un NUEVO array — no modifica el original.
    // "(t) => t.completada" = función flecha que devuelve el booleano directamente.
    // Equivalente a: (t) => t.completada === true
  }
}
