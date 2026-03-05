// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: EliminarTarea
// ═══════════════════════════════════════════════════════════════════════════════

import type { ITareaRepository } from '@/application/ports/ITareaRepository'


export class EliminarTarea {
  private repo: ITareaRepository

  constructor(repo: ITareaRepository) {
    this.repo = repo
  }

  async execute(id: string): Promise<void> {
    // "Promise<void>" = operación async que no devuelve ningún valor al terminar.
    // "void" en TypeScript = ausencia de valor. No es null, no es undefined — es nada.
    await this.repo.eliminar(id)
    // Si la tarea no existe, el repo lanza un Error.
    // El hook recibirá ese Error en "onError" y podrá mostrarlo en la UI.
  }
}
