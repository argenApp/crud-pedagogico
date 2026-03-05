// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: DOMAIN — OUTPUT DTO
//
// ★ Este es el OUTPUT DTO — lo que el sistema devuelve después de ejecutar
//   un UseCase. Es el "sobre de respuesta" que viaja desde Infrastructure
//   hasta el componente de Presentation.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ no es lo mismo que la Entity (Tarea)?
//
//   Entity → src/domain/entities/Tarea.ts
//     → Define QUÉ ES una Tarea en el mundo del negocio.
//     → Puede tener métodos, invariantes, lógica de estado.
//     → Es el "ciudadano de pleno derecho" del Domain.
//     → TareaEntity.validarCreacion() vive ahí — es comportamiento.
//
//   Output DTO → src/domain/outputDTO/TareaOutputDTO.ts  ← ESTE ARCHIVO
//     → Define QUÉ DATOS devuelve el sistema hacia afuera.
//     → Es un objeto de datos puro: SIN métodos, SIN comportamiento.
//     → Es el "sobre de respuesta" del UseCase hacia la Presentation.
//     → En sistemas complejos puede ser un SUBCONJUNTO de la Entity
//       (ej: ocultás campos sensibles, o calculás campos derivados).
//     → Vive en su propia carpeta outputDTO/ — separada de entities/.
//
// En este CRUD pedagógico los campos coinciden — pero siguen siendo
// conceptos distintos y viven en carpetas y archivos distintos.
//
// ─────────────────────────────────────────────────────────────────────────────
// Mapa de dónde nacen los DTOs:
//
//   ★ INPUT DTO  → application/inputDTO/TareaInputDTO.ts  (CrearTareaInput, ActualizarTareaInput)
//                  Lo que el USUARIO envía hacia adentro (sube).
//
//   ★ OUTPUT DTO → domain/outputDTO/TareaOutputDTO.ts  ← ESTE ARCHIVO
//                  Lo que el SISTEMA devuelve hacia afuera (baja).
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿Quién PRODUCE el Output DTO?
//   infrastructure/repositories/TareaRepositoryImpl.ts → función _toOutputDTO()
//   Convierte el JSON raw del backend (snake_case) en este objeto (camelCase).
//
// ¿Quién CONSUME el Output DTO?
//   → application/useCases/Tareas/*.ts  (los UseCases lo devuelven)
//   → adapters/ui/hooks/useTareasQueries.ts (React Query lo cachea)
//   → presentation/components/*.tsx  (los componentes lo usan en onSuccess)
//
// ✅ Puede importar: NADA. Es un objeto de datos puro.
// ❌ NO puede importar: React, fetch, ni nada externo.
// ═══════════════════════════════════════════════════════════════════════════════

export interface TareaOutputDTO {
  // "interface" = TypeScript. SOLO existe al programar. Desaparece al compilar.
  // "export" = importable desde otros archivos.
  // No tiene métodos — es datos puros.

  id: string
  // Generado por el backend (UUID). El usuario nunca lo envía.
  // Aparece aquí porque el SISTEMA ya lo generó — es parte de la respuesta.

  titulo: string
  // El texto de la tarea (ya validado y normalizado por el Domain y el UseCase).

  completada: boolean
  // Estado actual. Puede haber cambiado desde la creación.

  creadaEn: string
  // Timestamp ISO 8601, generado por el backend.
  // En camelCase porque _toOutputDTO() ya hizo la conversión desde creada_en (snake_case).
}
