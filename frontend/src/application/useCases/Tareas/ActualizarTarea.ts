// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: ActualizarTarea
// ═══════════════════════════════════════════════════════════════════════════════

import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// OUTPUT DTO — lo que devuelve este UseCase tras actualizar la tarea.

import { TareaEntity } from '@/domain/entities/Tarea'
// La clase con las reglas de negocio. Importación de clase JS — existe en runtime.

import type { ActualizarTareaInput } from '@/application/inputDTO/TareaInputDTO'
import type { ITareaRepository } from '@/application/ports/ITareaRepository'


export class ActualizarTarea {
  private repo: ITareaRepository

  constructor(repo: ITareaRepository) {
    this.repo = repo
  }

  async execute(id: string, input: ActualizarTareaInput): Promise<TareaOutputDTO> {
    // "id: string" → el ID de la tarea a actualizar. Viene del componente.
    // "input: ActualizarTareaInput" → los campos nuevos (titulo, completada).

    // ── Paso 1: Validar el nuevo título en el Domain ─────────────────────────
    TareaEntity.validarCreacion(input.titulo)
    // Reutilizamos validarCreacion — las reglas del título son las mismas.
    // El Domain tiene UN solo lugar donde vive esa regla.

    // ── Paso 2: Delegar la actualización al Repositorio ──────────────────────
    return await this.repo.actualizar(id, input)
    // Si la tarea no existe, el repo lanza un Error → el hook activa "onError".
  }
}
