// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Puerto (Port / Interface del Repositorio)
//
// Analogía: el "contrato laboral". El UseCase dice:
//   "necesito a alguien que sepa crear, listar, actualizar y eliminar tareas".
// Este archivo define ESE CONTRATO. No sabe CÓMO se implementa.
//
// Principio de Inversión de Dependencias (DIP):
//   Application define QUÉ necesita (este archivo).
//   Infrastructure decide CÓMO hacerlo (TareaRepositoryImpl).
//   El UseCase depende de la ABSTRACCIÓN — nunca de la implementación concreta.
//
// ✅ Puede importar: domain/outputDTO, domain/entities, application/inputDTO (Input DTOs)
// ❌ NO puede importar: fetch, localStorage, ningún detalle de implementación
// ═══════════════════════════════════════════════════════════════════════════════

import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// Importamos el OUTPUT DTO — lo que el repositorio promete devolver tras cada operación.
// Vive en domain/outputDTO/ — carpeta separada de entities/ (conceptos distintos).
// El Puerto trabaja con Output DTOs: no con modelos de DB, no con JSON crudo.
// "import type" = TypeScript puro. Desaparece al compilar.

import type { CrearTareaInput, ActualizarTareaInput } from '@/application/inputDTO/TareaInputDTO'
// Importamos los INPUT DTOs — los parámetros que reciben los métodos.


export interface ITareaRepository {
  // "I" al inicio = convención para "Interface". Señaliza que es un contrato.
  // En TypeScript, "interface" describe comportamiento (tiene métodos).
  // Esta interface es TypeScript puro — desaparece al compilar.

  crear(input: CrearTareaInput): Promise<TareaOutputDTO>
  // INPUT DTO entra → OUTPUT DTO sale.
  // "Promise<TareaOutputDTO>" = operación asíncrona que devuelve el Output DTO.
  // El UseCase no sabe si adentro hay HTTP, SQLite, o un mock en memoria.

  listar(): Promise<TareaOutputDTO[]>
  // "TareaOutputDTO[]" = array de Output DTOs. Equivalente a "Array<TareaOutputDTO>".
  // Cuando no hay tareas, devuelve [] (array vacío), no null.

  obtenerPorId(id: string): Promise<TareaOutputDTO | null>
  // "TareaOutputDTO | null" = puede devolver un Output DTO O null.
  // "|" en TypeScript = "union type" — acepta cualquiera de los dos tipos.
  // Si no existe la tarea con ese ID, devuelve null.

  actualizar(id: string, input: ActualizarTareaInput): Promise<TareaOutputDTO>
  // Recibe el ID + Input DTO de actualización → devuelve el Output DTO actualizado.

  eliminar(id: string): Promise<void>
  // "Promise<void>" = no devuelve valor — solo confirma que se eliminó.
}
