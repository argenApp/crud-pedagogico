// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: INFRASTRUCTURE — Implementación del Repositorio
//
// Posición en la cadena de dependencias:
//   UseCase → ITareaRepository (contrato) → TareaRepositoryImpl (ESTE ARCHIVO) → apiClient → fetch
//
// EL ÚNICO LUGAR CON snake_case EN TODO EL FRONTEND.
// Implementa ITareaRepository. _toOutputDTO() es el único punto de conversión
// snake_case (backend) → camelCase (frontend).
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  EL ÚNICO LUGAR CON snake_case EN TODO EL FRONTEND                      │
// │                                                                          │
// │  Backend (Python/FastAPI) usa:    creada_en                              │
// │  Frontend (TypeScript/React) usa: creadaEn                               │
// │                                                                          │
// │  La conversión ocurre SOLO en _toOutputDTO(). En ningún otro archivo.   │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Responsabilidades ÚNICAS de esta capa:
//   1. Llamar al backend vía HTTP (usando apiClient)
//   2. Convertir snake_case (backend) → camelCase (frontend) en _toOutputDTO()
//   3. Enviar los datos en el formato que espera el backend
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: domain/outputDTO, domain/entities, application/inputDTO, application/ports, apiClient
//   ❌ NO puede importar: React, hooks, componentes de presentación
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   Network > Fetch/XHR: cada método genera 1 request (GET, POST, PUT, DELETE).
//   Console: agrega console.log('[REPO] raw:', raw) ANTES de llamar a _toOutputDTO()
//   para ver la respuesta RAW del backend con snake_case (creada_en, etc.).
//   Comparalo con el TareaOutputDTO resultante → la conversión es visible.
// ═══════════════════════════════════════════════════════════════════════════════

import type { TareaOutputDTO } from '@/domain/outputDTO/TareaOutputDTO'
// OUTPUT DTO — lo que esta capa produce y entrega hacia arriba (hacia los UseCases).
// Vive en domain/outputDTO/ — carpeta dedicada, separada de domain/entities/.
// "type" = TypeScript puro, desaparece al compilar.

import type { CrearTareaInput, ActualizarTareaInput } from '@/application/inputDTO/TareaInputDTO'
import type { ITareaRepository } from '@/application/ports/ITareaRepository'
import { apiClient } from '@/infrastructure/api/apiClient'


// ─────────────────────────────────────────────────────────────────────────────
// Tipo que representa la respuesta RAW del backend (snake_case)
// ─────────────────────────────────────────────────────────────────────────────

interface TareaApiResponse {
  // "interface" = TypeScript. Desaparece al compilar.
  // Este tipo SOLO existe en este archivo — el único lugar del frontend
  // que ve los nombres en snake_case tal como los devuelve el backend.

  id: string
  titulo: string
  completada: boolean
  creada_en: string
  // ↑ snake_case: viene directamente del JSON del backend FastAPI.
  // "creada_en" en Python → "creadaEn" en TypeScript (la conversión ocurre en _toOutputDTO).
}


// ─────────────────────────────────────────────────────────────────────────────
// La función de conversión: snake_case → camelCase + produce el Output DTO
// ─────────────────────────────────────────────────────────────────────────────

function _toOutputDTO(raw: TareaApiResponse): TareaOutputDTO {
  // "_toOutputDTO" = función "privada" (convención del "_" al inicio).
  // Solo se usa dentro de este archivo.
  //
  // "raw: TareaApiResponse" → el JSON crudo con snake_case del backend.
  // ": TareaOutputDTO" → lo que devuelve: el Output DTO con camelCase.
  //
  // Analogía: es el "traductor" entre el idioma del backend (Python, snake_case)
  // y el idioma del frontend (TypeScript, camelCase).
  //
  // ¿Por qué devolvemos TareaOutputDTO y no la Entity (Tarea)?
  //   → TareaOutputDTO = datos puros que viajan hacia afuera. No tiene lógica ni métodos.
  //   → TareaEntity = la clase con lógica (validarCreacion). Solo vive en Domain.
  //   → El repositorio produce Output DTOs, no Entities con comportamiento.

  // 🔍 Console: console.log('[REPO] raw.creada_en:', raw.creada_en, '→ creadaEn:', raw.creada_en)
  // Este es el ÚNICO punto donde snake_case se convierte a camelCase en todo el frontend.

  return {
    id:         raw.id,
    titulo:     raw.titulo,
    completada: raw.completada,
    creadaEn:   raw.creada_en,
    // ↑ LA CONVERSIÓN: snake_case → camelCase ocurre SOLO AQUÍ.
    // "raw.creada_en" (snake) → "creadaEn" (camel)
    //
    // Si mañana el backend renombra "creada_en" a "fecha_creacion":
    //   → Solo cambia esta línea.
    //   → TareaOutputDTO.creadaEn NO cambia.
    //   → Los componentes NO cambian.
    //   → Los UseCases NO cambian.
    // Eso es el poder de aislar la conversión aquí.
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Implementación del Repositorio
// ─────────────────────────────────────────────────────────────────────────────

export class TareaRepositoryImpl implements ITareaRepository {
  // "implements ITareaRepository" → TypeScript verifica que implementemos
  // TODOS los métodos definidos en la interface.
  // Si falta uno, TypeScript falla con: "Property 'X' is missing in type..."
  // Es el compilador actuando como "inspector de calidad".

  async crear(input: CrearTareaInput): Promise<TareaOutputDTO> {
    // 🔍 Network: POST /api/v1/tareas/ → Payload: { titulo } | Response: { id, titulo, completada, creada_en }
    const raw = await apiClient.post<TareaApiResponse>('/api/v1/tareas/', {
      // "<TareaApiResponse>" = generic que le dice al apiClient qué tipo de respuesta esperar.
      // TypeScript verifica que el resultado sea TareaApiResponse antes de usarlo.

      titulo: input.titulo,
      // Solo enviamos "titulo" — el backend genera id, completada y creada_en.
      // En el payload NO hay camelCase problemático porque "titulo" es igual en ambos.
    })
    return _toOutputDTO(raw)
    // Convertimos la respuesta raw (snake_case) al Output DTO (camelCase).
  }

  async listar(): Promise<TareaOutputDTO[]> {
    // 🔍 Network: GET /api/v1/tareas/ → Response: array JSON con snake_case.
    // Después de .map(_toOutputDTO) → camelCase en el frontend.
    const raws = await apiClient.get<TareaApiResponse[]>('/api/v1/tareas/')
    // "TareaApiResponse[]" → esperamos un array de responses raw.

    return raws.map(_toOutputDTO)
    // ".map(_toOutputDTO)" = aplica _toOutputDTO a cada elemento del array.
    // Equivalente a: raws.map((raw) => _toOutputDTO(raw))
    // Resultado: TareaOutputDTO[] (array de Output DTOs).
    // Iron Law 3: el repositorio devuelve OutputDTOs (nunca raw API response).
  }

  async obtenerPorId(id: string): Promise<TareaOutputDTO | null> {
    try {
      const raw = await apiClient.get<TareaApiResponse>(`/api/v1/tareas/${id}`)
      // Template literal: `/api/v1/tareas/${id}` → `/api/v1/tareas/f47ac10b-...`
      return _toOutputDTO(raw)
    } catch {
      // Si el backend devuelve 404, apiClient lanza un Error.
      // Lo capturamos y devolvemos null (el UseCase decide qué hacer).
      return null
    }
  }

  async actualizar(id: string, input: ActualizarTareaInput): Promise<TareaOutputDTO> {
    // 🔍 Network: PUT /api/v1/tareas/{id} → Payload: { titulo, completada }
    const raw = await apiClient.put<TareaApiResponse>(`/api/v1/tareas/${id}`, {
      titulo:     input.titulo,
      completada: input.completada,
      // "completada" es igual en ambos idiomas — no hay conversión necesaria.
      // Si hubiera un campo como "estaCompletada" (camel) → "esta_completada" (snake),
      // la conversión iría aquí: esta_completada: input.estaCompletada
    })
    return _toOutputDTO(raw)
  }

  async eliminar(id: string): Promise<void> {
    // 🔍 Network: DELETE /api/v1/tareas/{id} → status 204, sin body.
    await apiClient.delete(`/api/v1/tareas/${id}`)
    // No hay respuesta que procesar (HTTP 204 No Content).
    // Si la tarea no existe, apiClient lanza un Error → el UseCase lo propaga.
  }
}
