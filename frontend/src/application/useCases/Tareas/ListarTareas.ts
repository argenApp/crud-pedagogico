// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: ListarTareas
//
// ★ ESTE USE CASE DEMUESTRA POR QUÉ LAS LECTURAS PASAN POR EL USE CASE
// ─────────────────────────────────────────────────────────────────────────────
// Pregunta pedagógica: ¿por qué el Adapter no llama al repo directamente?
//
//   queryFn → repo.listar()  ← ¿qué pasa con las reglas de visibilidad?
//             NADA. Todos ven todo. Sin control de acceso.
//
//   queryFn → UseCase.execute(rol)         ← ✅ correcto
//             → repo.listar()              (obtiene todos los datos)
//             → ReglaRol.filtrarPorRol()   (aplica la regla de negocio)
//             → devuelve solo lo que ese rol puede ver
//
// El UseCase es el GUARDIÁN del acceso. El repo solo sabe buscar datos.
// Las reglas de QUIÉN puede ver QUÉ viven en el Domain (ReglaRol).
// El UseCase orquesta: pide los datos al repo, aplica la regla del Domain.
//
// ✅ Puede importar: domain/outputDTO, domain/roles, application/ports
// ❌ NO puede importar: fetch, React, TareaRepositoryImpl, nada de Infrastructure
// ═══════════════════════════════════════════════════════════════════════════════

import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// OUTPUT DTO — lo que devuelve este UseCase: un array de datos puros.

import type { ITareaRepository } from '@/application/ports/ITareaRepository'

import { type Rol, ReglaRol } from '@/domain/roles/Rol'
// "Rol" → tipo TypeScript (desaparece al compilar)
// "ReglaRol" → clase JavaScript con la regla de negocio (existe en runtime)
// "{ type Rol, ReglaRol }" → importación mixta: tipo + valor en una línea


export class ListarTareas {
  private repo: ITareaRepository

  constructor(repo: ITareaRepository) {
    this.repo = repo
  }

  async execute(rol: Rol): Promise<TareaOutputDTO[]> {
    // "rol: Rol" → el rol del usuario que hace la solicitud.
    // El Adapter (hook) lo obtiene de Zustand y lo pasa aquí.
    // El UseCase NO sabe de dónde viene el rol — eso es responsabilidad del Adapter.

    // ── Paso 1: Obtener todos los datos del repositorio ──────────────────────
    const todas = await this.repo.listar()
    // El repositorio siempre devuelve TODOS los datos.
    // El repo no sabe de roles — esa es responsabilidad de esta capa.
    // Separación de responsabilidades: repo = datos, UseCase = reglas.

    // ── Paso 2: Aplicar la regla de negocio del Domain ───────────────────────
    return ReglaRol.filtrarPorRol(todas, rol)
    // "ReglaRol.filtrarPorRol()" vive en Domain — el árbitro del negocio.
    //
    // ¿Qué hace la regla?
    //   ADMIN  → devuelve "todas" sin modificar
    //   VIEWER → devuelve solo las tareas con completada === true
    //
    // ¿Por qué la regla vive en Domain y no acá en el UseCase?
    //   → Reutilizable: si mañana CrearTarea también necesita verificar el rol,
    //     llama a ReglaRol sin duplicar la lógica.
    //   → Testeable: podés testear ReglaRol sin instanciar el UseCase ni el repo.
    //   → Single Responsibility: el UseCase orquesta, el Domain decide.
  }
}
