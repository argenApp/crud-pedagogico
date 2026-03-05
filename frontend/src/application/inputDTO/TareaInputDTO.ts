// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — DTOs de Entrada (Input DTOs)
//
// Posición en la cadena de dependencias:
//   Presentation (componente) → Adapter (hook mutationFn) → UseCase.execute(input)
//   Los Input DTOs son los "sobres de entrada" que viajan en esa dirección.
//
// Define lo que el USUARIO puede enviar. Lo que NO está acá no puede enviarse al servidor.
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: nada (son interfaces puras de TypeScript)
//   ❌ NO puede importar: React, fetch, domain entities (los DTOs son independientes)
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Network > Fetch/XHR > POST /api/v1/tareas/ > Payload tab
//   → verás exactamente los campos de este DTO (solo "titulo") en el body del request.
//   Network > Fetch/XHR > PUT /api/v1/tareas/{id} > Payload tab
//   → verás "titulo" y "completada" del ActualizarTareaInput.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Nombre del archivo: TareaInputDTO.ts
// Convención: todos los INPUT DTOs de una entidad viven en UN solo archivo.
// "Find All References" en CrearTareaInput muestra la cadena completa.
//
// "DTO" = Data Transfer Object. Objetos que transportan datos entre capas.
//
// ¿Por qué están aquí y no en el Domain?
// Porque definen lo que el UseCase NECESITA para ejecutarse.
// El UseCase es de Application — entonces sus DTOs también.
//
// INPUT DTO ≠ OUTPUT DTO:
//   INPUT  → application/inputDTO/TareaInputDTO.ts  ← ESTE ARCHIVO
//             Lo que el USUARIO envía hacia adentro (sin id, sin creadaEn).
//   OUTPUT → domain/outputDTO/TareaOutputDTO.ts
//             Lo que el SISTEMA devuelve hacia afuera (con id, con creadaEn).
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// INPUT DTO para CREAR una tarea
// ─────────────────────────────────────────────────────────────────────────────

export interface CrearTareaInput {
  // "export interface" = esta interfaz es importable desde otros archivos.
  // TypeScript puro — desaparece al compilar. Solo existe mientras programás.

  titulo: string
  // El único campo que el usuario envía para crear una tarea.
  //
  // Nótese lo que NO está acá:
  //   ❌ id       → lo genera el backend (UUID automático)
  //   ❌ creadaEn → lo genera el backend (timestamp automático)
  //   ❌ completada → toda tarea nueva nace como false (regla del Domain)
  //
  // Si el componente enviara "id", el usuario podría manipular el UUID — problema de seguridad.
  // Si enviara "creadaEn", podría falsear la fecha. El backend es la fuente de verdad.
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT DTO para ACTUALIZAR una tarea
// ─────────────────────────────────────────────────────────────────────────────

export interface ActualizarTareaInput {
  titulo: string
  // El nuevo título — debe seguir las mismas reglas del Domain.

  completada: boolean
  // El usuario puede cambiar el estado: marcar como completa o revertirla.
  // En actualización, el usuario SÍ envía "completada" (a diferencia de la creación).
}
