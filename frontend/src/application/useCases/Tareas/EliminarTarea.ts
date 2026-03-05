// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: EliminarTarea
//
// Posición en la cadena de dependencias:
//   Adapter (mutationFn) → EliminarTarea.execute(id) → repo.eliminar(id) → HTTP DELETE
//
// Orquesta la eliminación: delega al repo. No hay validación de Domain en este caso
// porque el Domain no tiene reglas de negocio para QUIÉN puede eliminar (en este CRUD).
// En un sistema real, aquí verificaría permisos: ¿puede este rol eliminar?
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: application/ports
//   ❌ NO puede importar: fetch, React, TareaRepositoryImpl, nada de Infrastructure
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Network > Fetch/XHR: DELETE /api/v1/tareas/{id} → status 204 No Content
//   La columna 'Size' en Network tab = 0 B (sin body — HTTP 204 no tiene cuerpo).
//   React Query DevTools: después del DELETE exitoso → query ['tareas', *] pasa a 'stale'.
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
    //
    // Iron Law 2: TODAS las escrituras pasan por UseCase.
    // El componente llama al hook → hook llama a execute() → execute() llama al repo.
    // NUNCA: componente → repo directamente.

    // 🔍 Network: DELETE /api/v1/tareas/{id} → status 204 sin body.
    // Si ves status 404 → la tarea no existe → el repo lanzará un Error.
    await this.repo.eliminar(id)
    // Si la tarea no existe, el repo lanza un Error.
    // El hook recibirá ese Error en "onError" y podrá mostrarlo en la UI.
  }
}
