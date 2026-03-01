// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: INFRASTRUCTURE — Cliente HTTP
//
// Este archivo centraliza la URL base del backend y la lógica de fetch.
// Si la URL del backend cambia, solo cambiás este archivo.
//
// ✅ Puede importar: nada externo (solo fetch nativo del browser)
// ❌ NO puede importar: React, domain entities, application use cases
// ═══════════════════════════════════════════════════════════════════════════════

const BASE_URL = 'http://localhost:8000'
// La URL del backend FastAPI en desarrollo.
// En producción sería: 'https://api.mi-app.com'
// "const" = constante — no puede reasignarse después de declararse.

// ─────────────────────────────────────────────────────────────────────────────
// Tipo para las respuestas de error del backend
// ─────────────────────────────────────────────────────────────────────────────

interface ApiErrorResponse {
  // "interface" = TypeScript. Desaparece al compilar.
  // Define la forma del JSON de error que devuelve FastAPI.
  detail: string
  // FastAPI devuelve { "detail": "mensaje de error" } en los errores HTTP.
}

// ─────────────────────────────────────────────────────────────────────────────
// Función auxiliar para manejar la respuesta de fetch
// ─────────────────────────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  // "<T>" = generic de TypeScript. Al llamar esta función, especificás el tipo:
  //   handleResponse<Tarea>(response)    → T = Tarea
  //   handleResponse<Tarea[]>(response)  → T = array de Tarea
  //   handleResponse<void>(response)     → T = void (sin retorno)
  // TypeScript verifica que el resultado sea del tipo correcto.

  if (!response.ok) {
    // "response.ok" = true si el HTTP status es 200-299.
    // Si es 400, 404, 422, 500, etc. → response.ok es false.
    const errorData: ApiErrorResponse = await response.json()
    // "await response.json()" = lee el body de la respuesta como JSON.
    // Necesitamos "await" porque leer el body es asíncrono.
    // TypeScript verifica que tenga la forma de ApiErrorResponse.

    throw new Error(errorData.detail || `Error HTTP ${response.status}`)
    // "throw" lanza la excepción — detiene esta función.
    // El repositorio que llamó a esta función recibirá el Error.
    // El UseCase lo propagará al hook, que lo pasará a "onError" en el componente.
  }

  if (response.status === 204) {
    // HTTP 204 = No Content (el servidor no devuelve body).
    // Ej: respuesta del DELETE exitoso.
    return undefined as unknown as T
    // Hack de TypeScript: "as unknown as T" fuerza el tipo.
    // "undefined" es correcto para Promise<void> — pero TypeScript necesita el cast.
  }

  return response.json() as Promise<T>
  // ".json()" parsea el body JSON a un objeto JavaScript.
  // "as Promise<T>" → TypeScript confía en que el JSON tiene la forma de T.
}

// ─────────────────────────────────────────────────────────────────────────────
// Funciones de HTTP (GET, POST, PUT, DELETE)
// ─────────────────────────────────────────────────────────────────────────────

export const apiClient = {
  // "export const apiClient" = exportamos un objeto con métodos.
  // El repositorio lo importará: import { apiClient } from '@/infrastructure/api/apiClient'

  async get<T>(path: string): Promise<T> {
    // "path: string" → la ruta del endpoint. Ej: '/api/tareas/'
    const response = await fetch(`${BASE_URL}${path}`, {
      // "fetch" = función nativa del browser para hacer HTTP requests.
      // Es JavaScript puro — no es una librería externa.
      // `${BASE_URL}${path}` → template literal: concatena las dos strings.
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // "Content-Type: application/json" → le dice al servidor que hablamos JSON.
    })
    return handleResponse<T>(response)
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    // "body: unknown" → el tipo del cuerpo del request.
    // "unknown" es el tipo más seguro — TypeScript obliga a verificarlo antes de usarlo.
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // JSON.stringify() convierte el objeto JavaScript a string JSON.
      // Ej: { titulo: "Comprar leche" } → '{"titulo":"Comprar leche"}'
      // El body de fetch DEBE ser string (o Blob, FormData, etc.) — nunca un objeto.
    })
    return handleResponse<T>(response)
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
  },

  async delete(path: string): Promise<void> {
    // "Promise<void>" → no devuelve ningún valor (DELETE exitoso = HTTP 204).
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    return handleResponse<void>(response)
  },
}
