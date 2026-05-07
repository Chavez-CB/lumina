/**
 * HTTP Client — Abstracción fetch
 * 
 * Centraliza toda comunicación HTTP con backend
 * HOY: sin backend (mock en facialService)
 * FUTURO: conecta con API real
 * 
 * Cambio único cuando backend esté listo:
 * - Cambiar baseURL en env
 * - Descomentar líneas POST/GET en facialService.ts
 * - Listo
 * 
 * Uso:
 *   import { httpClient } from "@/lib/api/client"
 *   const res = await httpClient.post<FacialAuthResponse>('/auth/facial', payload)
 */

interface RequestOptions {
  timeout?: number                       // Milisegundos antes de cancelar
  headers?: Record<string, string>
  retries?: number                       // Cuántas veces reintentar
}

interface HttpError extends Error {
  status: number
  body?: unknown
}

export class HttpClient {
  private baseURL: string

  constructor(baseURL: string = import.meta.env.PUBLIC_API_URL || "http://localhost:3000/api") {
    this.baseURL = baseURL
  }

  /**
   * POST — Enviar datos
   * 
   * Ej: enviar frame facial → backend valida → retorna user+token
   * 
   * @template T - Tipo de respuesta esperada
   * @param path - Ruta relativa ej: '/auth/facial'
   * @param body - Datos a enviar (serializados a JSON)
   * @param options - timeout, headers, reintentos
   * @returns Promise con respuesta tipada
   */
  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    })
  }

  /**
   * GET — Obtener datos
   * 
   * Ej: obtener perfil usuario loggeado
   * 
   * @template T - Tipo de respuesta esperada
   * @param path - Ruta relativa ej: '/users/me'
   * @param options - timeout, headers, reintentos
   * @returns Promise con respuesta tipada
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      method: "GET",
      ...options,
    })
  }

  /**
   * PUT — Actualizar datos
   * 
   * Ej: cambiar contraseña, actualizar perfil
   * 
   * @template T - Tipo de respuesta esperada
   * @param path - Ruta relativa
   * @param body - Datos nuevos
   * @param options - timeout, headers, reintentos
   * @returns Promise con respuesta tipada
   */
  async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    })
  }

  /**
   * DELETE — Borrar datos
   * 
   * Ej: logout (borrar sesión)
   * 
   * @template T - Tipo de respuesta esperada
   * @param path - Ruta relativa
   * @param options - timeout, headers, reintentos
   * @returns Promise con respuesta tipada
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      method: "DELETE",
      ...options,
    })
  }

  /**
   * REQUEST — Método privado (lógica común)
   * 
   * Centraliza:
   * - Construcción URL
   * - Headers por defecto
   * - Timeout con AbortController
   * - Error handling
   * - Reintentos automáticos
   * 
   * @template T - Tipo de respuesta
   * @param path - Ruta relativa
   * @param options - Opciones de fetch + custom options
   * @returns Promise con respuesta tipada
   */
  private async request<T>(
    path: string,
    options: RequestInit & RequestOptions
  ): Promise<T> {
    const { timeout = 10000, retries = 0, headers = {}, ...fetchOptions } = options
    const url = `${this.baseURL}${path}`

    // Headers por defecto
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...headers,
    }

    let lastError: Error | null = null

    // Reintentar si falla (útil para conexiones inestables)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // AbortController = forma de cancelar fetch si pasa timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers: defaultHeaders,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Si status != 2xx (200-299)
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          const error = Object.assign(new Error(`HTTP ${response.status}`), {
            status: response.status,
            body,
          }) as HttpError
          throw error
        }

        // Parsear respuesta
        const data: T = await response.json()
        return data
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Si es el último intento, lanzar error
        if (attempt === retries) {
          throw lastError
        }

        // Si no, esperar antes de reintentar (backoff: 100ms, 200ms, 300ms)
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
      }
    }

    throw lastError || new Error("Unknown error")
  }
}

/**
 * Singleton exportado
 * 
 * Importar en toda la app con:
 *   import { httpClient } from "@/lib/api/client"
 *   const response = await httpClient.post('/auth/facial', payload)
 */
export const httpClient = new HttpClient()
