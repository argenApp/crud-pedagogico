// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: ListarTareas
//
// ★ Demuestra por qué los GET pasan por UseCase: aplica ReglaRol antes de devolver datos.
//
// Posición en la cadena de dependencias:
//   Adapter (queryFn) → ListarTareas.execute(rol) → repo.listar() → ReglaRol.filtrarPorRol()
//
// ─────────────────────────────────────────────────────────────────────────────
// PREGUNTA PEDAGÓGICA: ¿por qué el Adapter no llama al repo directamente?
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
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: domain/outputDTO, domain/roles, application/ports
//   ❌ NO puede importar: fetch, React, TareaRepositoryImpl, nada de Infrastructure
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Console: agrega console.log('[USE_CASE] ListarTareas rol=', rol, 'total=', todas.length)
//   para ver: rol=ADMIN total=5 / rol=VIEWER completadas=2
//   Network: el GET /api/v1/tareas/ que verás devuelve TODAS las tareas (sin filtro de rol).
//   El filtro por rol ocurre DESPUÉS, aquí en el UseCase, sin otra request HTTP.
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
    // 🔍 Network: el GET /api/v1/tareas/ que verás acá devuelve TODAS las tareas.
    // El repositorio siempre devuelve TODO — no sabe de roles.
    const todas = await this.repo.listar()
    // El repositorio siempre devuelve TODOS los datos.
    // El repo no sabe de roles — esa es responsabilidad de esta capa.
    // Separación de responsabilidades: repo = datos, UseCase = reglas.

    // ── Paso 2: Aplicar la regla de negocio del Domain ───────────────────────
    // 🔍 Console: console.log('[USE_CASE] ListarTareas', rol, todas.length, '→ filtradas')
    // VIEWER siempre verá menos que ADMIN si hay tareas pendientes.
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
