// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: ListarTareas
// ═══════════════════════════════════════════════════════════════════════════════

import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// OUTPUT DTO — lo que devuelve este UseCase: un array de datos puros.
// "type" antes del import = TypeScript puro, desaparece al compilar.

import type { ITareaRepository } from '@/application/ports/ITareaRepository'


export class ListarTareas {
  private repo: ITareaRepository

  constructor(repo: ITareaRepository) {
    this.repo = repo
  }

  async execute(): Promise<TareaOutputDTO[]> {
    // "TareaOutputDTO[]" = array de Output DTOs.
    // TypeScript verifica que el repo devuelva exactamente eso.
    // El UseCase de lectura sin filtros es así de simple: una sola línea.
    // Si mañana necesitaras filtrar por estado o paginar, el código iría aquí —
    // sin tocar el repositorio, el hook, ni el componente.
    return await this.repo.listar()
  }
}
