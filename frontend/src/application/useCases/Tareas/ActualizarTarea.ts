// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: ActualizarTarea
//
// Posición en la cadena de dependencias:
//   Adapter (mutationFn) → ActualizarTarea.execute(id, input)
//                       → TareaEntity.validarCreacion() → repo.actualizar() → HTTP PUT
//
// Orquesta: 1) valida el nuevo título en Domain, 2) persiste via repo.
// NO hace HTTP directamente — delega al repositorio.
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: domain/entities, application/inputDTO, application/ports
//   ❌ NO puede importar: fetch, React, TareaRepositoryImpl, nada de Infrastructure
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Network > Fetch/XHR: PUT /api/v1/tareas/{id} con el body { titulo, completada }
//   Console: pon logs antes/después de validarCreacion para ver el flujo Domain → repo.
//   Si la validación falla → no hay PUT en Network. Si pasa → SÍ hay PUT.
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
    // 🔍 Console: console.log('[USE_CASE] ActualizarTarea.execute — validando en Domain')
    TareaEntity.validarCreacion(input.titulo)
    // Reutilizamos validarCreacion — las reglas del título son las mismas.
    // El Domain tiene UN solo lugar donde vive esa regla.
    // Iron Law 2: TODAS las escrituras pasan por UseCase → Domain valida SIEMPRE.

    // ── Paso 2: Delegar la actualización al Repositorio ──────────────────────
    // 🔍 Console: console.log('[USE_CASE] ActualizarTarea — Domain OK, delegando a repo')
    // 🔍 Network: PUT /api/v1/tareas/{id} → Payload: { titulo, completada }
    return await this.repo.actualizar(id, input)
    // Si la tarea no existe, el repo lanza un Error → el hook activa "onError".
  }
}
