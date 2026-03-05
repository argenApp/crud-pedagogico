// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: DOMAIN — El núcleo del sistema
//
// Este archivo NO importa nada externo — ni React, ni fetch, ni ningún framework.
// Si mañana migrás de React a Vue, este archivo no cambia.
//
// Regla de dependencias:
//   ✅ Solo TypeScript puro.
//   ❌ No puede importar: React, TanStack Query, fetch, ningún framework.
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Console → agrega console.log('[DOMAIN] validarCreacion:', titulo) dentro de
//   validarCreacion. Si aparece el log pero NO hay POST en Network → la validación
//   actuó ANTES del HTTP. El Domain rechaza; el repo nunca es llamado.
// ═══════════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
// ENTITY — el concepto de negocio
//
// ¿Diferencia con el Output DTO?
//   Entity     → define el CONCEPTO de negocio (el "diseño" del objeto).
//   Output DTO → define los DATOS que el sistema devuelve (el "sobre de respuesta").
//   En este CRUD coinciden, pero son conceptos distintos.
//   El Output DTO vive en → domain/outputDTO/TareaOutputDTO.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface Tarea {
  id:         string
  titulo:     string
  completada: boolean
  creadaEn:   string
  // camelCase: "creadaEn" en el frontend.
  // El backend lo llama "creada_en" (snake_case).
  // La conversión ocurre SOLO en TareaRepositoryImpl._toOutputDTO() — un único punto.
}


// ─────────────────────────────────────────────────────────────────────────────
// REGLAS DE NEGOCIO — viven en el Domain
//
// El UseCase (Application) consulta estas reglas antes de proceder.
// Si la validación falla → Error → el repo nunca es llamado → sin HTTP.
// ─────────────────────────────────────────────────────────────────────────────

export class TareaEntity {
  // Clase separada de la interface porque una interface no puede tener métodos con implementación.
  // Métodos "static" → se llaman en la clase, no en instancias: TareaEntity.validarCreacion(...)

  static validarCreacion(titulo: string): void {
    // ": void" = lanza Error si falla, sin devolver valor si pasa.

    if (!titulo || titulo.trim().length === 0) {
      throw new Error('El título de la tarea no puede estar vacío.')
    }

    if (titulo.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres.')
    }

    if (titulo.trim().length > 200) {
      throw new Error('El título no puede superar los 200 caracteres.')
    }
  }
}
