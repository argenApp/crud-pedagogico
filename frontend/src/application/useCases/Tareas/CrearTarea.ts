// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: APPLICATION — Use Case: CrearTarea
//
// Posición en la cadena de dependencias:
//   Adapter (mutationFn) → CrearTarea.execute() → TareaEntity.validarCreacion()
//                       → repo.crear() → HTTP POST
//
// Orquesta: 1) valida en Domain, 2) persiste via repo. NO hace HTTP directamente.
//
// Analogía: el "director de orquesta". No toca ningún instrumento —
// solo sabe a quién llamar y en qué orden.
//   1. Llama al Domain (árbitro) para validar.
//   2. Delega la persistencia al Repositorio (vía el Puerto).
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: domain/entities, application/inputDTO, application/ports
//   ❌ NO puede importar: fetch, React, TareaRepositoryImpl, nada de Infrastructure
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Console: pon un log ANTES de validarCreacion y DESPUÉS para ver el flujo.
//   Si la validación falla → no hay request en Network.
//   Si pasa la validación → SÍ aparece POST en Network > Fetch/XHR.
// ═══════════════════════════════════════════════════════════════════════════════

import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// OUTPUT DTO — lo que el UseCase devuelve tras crear la tarea.
// TypeScript puro: desaparece al compilar.

import { TareaEntity } from '@/domain/entities/Tarea'
// La clase con las reglas de negocio (validarCreacion).
// Importación de clase JavaScript — existe en runtime.

import type { CrearTareaInput } from '@/application/inputDTO/TareaInputDTO'
import type { ITareaRepository } from '@/application/ports/ITareaRepository'


export class CrearTarea {
  // "class" existe en JavaScript runtime. No es TypeScript puro como "interface".
  // El browser sí ejecuta esta clase.

  private repo: ITareaRepository
  // "private" = TypeScript. Significa que "repo" solo puede usarse dentro de esta clase.
  // En JavaScript compilado, "private" desaparece — JS no tiene privados reales.
  // "repo: ITareaRepository" → el tipo es el CONTRATO (interface), no la implementación.

  constructor(repo: ITareaRepository) {
    // "constructor" = función que se ejecuta al hacer "new CrearTarea(algo)".
    // "repo: ITareaRepository" → TypeScript verifica que quien lo crea pase
    // un objeto que implemente el contrato ITareaRepository.
    this.repo = repo
    // "this" = la instancia actual de la clase.
    // Guardamos el repo para usarlo en execute().
  }

  async execute(input: CrearTareaInput): Promise<TareaOutputDTO> {
    // "async" convierte la función en asíncrona — siempre devuelve una Promise.
    // "execute" = nombre estándar para el método principal del UseCase.
    // "(input: CrearTareaInput)" → TypeScript verifica que llegue el tipo correcto.
    // ": Promise<TareaOutputDTO>" → TypeScript garantiza que devolvemos una Promise de TareaOutputDTO.
    //   TareaOutputDTO = el OUTPUT DTO: datos puros que viajan hacia afuera (hacia el hook y la UI).
    //   TareaOutputDTO ≠ TareaEntity: la Entity tiene métodos y lógica; el Output DTO es solo datos.
    //   "<TareaOutputDTO>" es un generic — TypeScript puro, desaparece al compilar.

    // ── Paso 1: Validar en el Domain ─────────────────────────────────────────
    // 🔍 Console: console.log('[USE_CASE] CrearTarea.execute — validando en Domain')
    // Si ves este log pero NO hay POST en Network → la validación falló en el Domain.
    TareaEntity.validarCreacion(input.titulo)
    // "input.titulo" accede a la propiedad "titulo" del objeto input.
    // Si el título es inválido, TareaEntity lanza un Error y execute() se detiene aquí.
    // El hook (Adapter) recibirá ese Error en el callback "onError".

    // ── Paso 2: Delegar al Repositorio ───────────────────────────────────────
    // 🔍 Console: console.log('[USE_CASE] CrearTarea — Domain OK, delegando a repo')
    // Si ves este log → SÍ habrá POST en Network > Fetch/XHR.
    return await this.repo.crear(input)
    // "await" espera que la Promise se resuelva antes de continuar.
    // Sin "await": this.repo.crear(input) devolvería una Promise sin resolver.
    // Con "await": esperamos el resultado real (la TareaOutputDTO creada).
    //
    // "this.repo.crear(input)" llama al método del CONTRATO (ITareaRepository).
    // El UseCase NO sabe que adentro hay TareaRepositoryImpl ni fetch.
    // Solo sabe que le prometieron un "crear()" que devuelve Promise<TareaOutputDTO>.
  }
}
