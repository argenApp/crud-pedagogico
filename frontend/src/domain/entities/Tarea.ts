// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: DOMAIN — El núcleo del sistema (Frontend)
//
// Analogía: la "constitución" del sistema. Define QUÉ es una Tarea y cuáles son
// las reglas máximas. No sabe que existe React, fetch, Tailwind, ni ningún browser.
//
// ✅ Puede importar: NADA externo. Solo TypeScript puro.
// ❌ NO puede importar: React, TanStack Query, fetch, ningún framework.
//
// Si mañana migrás de React a Vue, o de Vite a Webpack, este archivo NO cambia.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// ★ ENTITY — el objeto del negocio (NO confundir con el Output DTO)
//
// La Entity define QUÉ ES una Tarea en el mundo del negocio.
// Puede tener métodos y comportamiento (ver TareaEntity más abajo).
//
// ¿Diferencia con el Output DTO?
//   Entity     → define el CONCEPTO de negocio. Es el "diseño" del objeto.
//   Output DTO → define los DATOS que el sistema devuelve. Es el "sobre de respuesta".
//
//   En este CRUD los campos coinciden, pero son conceptos distintos.
//   El Output DTO vive en → domain/outputDTO/TareaOutput.ts
// ─────────────────────────────────────────────────────────────────────────────

// "export" hace que este tipo sea importable desde otros archivos.
// Sin "export", solo existiría dentro de este archivo.
export interface Tarea {
  // "interface" = contrato de TypeScript. SOLO EXISTE AL PROGRAMAR.
  // El browser nunca lo ve — desaparece al compilar a JavaScript.
  // Analogía: es como el plano de un edificio. Guía la construcción,
  // pero no es el edificio en sí.

  id: string
  // ": string" = anotación de tipo TypeScript. Solo al programar.
  // Le dice al compilador: "id solo puede contener texto".
  // En JavaScript compilado, es simplemente: id  (sin tipo).
  // Si alguien escribe tarea.id = 42, TypeScript falla ANTES de ejecutar.

  titulo: string
  // El texto de la tarea. Ej: "Comprar leche"

  completada: boolean
  // "boolean" en TypeScript = true o false. (En JS también es boolean, pero
  // TypeScript lo verifica en compilación — no en runtime).
  // Si ponés completada = "si", TypeScript avisa: "string no es boolean".

  creadaEn: string
  // camelCase: "creadaEn" en el frontend.
  // El backend lo llama "creada_en" (snake_case) — la conversión ocurre
  // SOLO en infrastructure/repositories/TareaRepositoryImpl.ts (_toOutputDTO).
  // En todo el resto del código: siempre camelCase.
}

// ─────────────────────────────────────────────────────────────────────────────
// REGLAS DE NEGOCIO — viven en el Domain
//
// Analogía: el árbitro del partido. Él decide si algo es válido.
// Los Use Cases (Application) le preguntan antes de proceder.
// ─────────────────────────────────────────────────────────────────────────────

export class TareaEntity {
  // "class" en TypeScript es igual que en JavaScript — existe en runtime.
  // Usamos una clase separada (no la interface Tarea) porque una interface
  // no puede tener métodos con implementación.
  // Convención: "TareaEntity" para la clase, "Tarea" para la interface/tipo.

  static validarCreacion(titulo: string): void {
    // "static" = este método se llama en la CLASE, no en una instancia.
    // TareaEntity.validarCreacion("texto")  ← correcto
    // new TareaEntity().validarCreacion("texto")  ← incorrecto para static

    // ": string" = parámetro tipado. El compilador verifica que llegue un string.
    // ": void" = esta función no devuelve ningún valor.
    //   Si algo falla: lanza un Error (excepción).
    //   Si todo pasa: termina sin devolver nada.

    if (!titulo || titulo.trim().length === 0) {
      // "!" antes de un valor = NOT lógico. !titulo = verdadero si titulo es falsy.
      // Falsy en JS: null, undefined, "", 0, false.
      // .trim() elimina espacios al inicio y al final.
      // .length === 0 verifica que no queden caracteres.
      throw new Error('El título de la tarea no puede estar vacío.')
      // "throw" lanza una excepción — detiene la ejecución aquí.
      // El UseCase que llamó a este método recibirá el Error.
    }

    if (titulo.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres.')
    }

    if (titulo.trim().length > 200) {
      throw new Error('El título no puede superar los 200 caracteres.')
    }
  }
}
