/**
 * HTTP Client — Abstracción fetch
 *
 * Centraliza toda comunicación HTTP con backend.
 * Desenvuelve automáticamente la envoltura { ok, data, message } del backend.
 *
 * Uso:
 *   import { httpClient } from "@/lib/api/client"
 *   const empleados = await httpClient.get<Empleado[]>('/empleados')
 */

import type { ApiResponse } from "@/types/api"

interface RequestOptions {
  timeout?: number
  headers?: Record<string, string>
  retries?: number
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

  /** GET — obtener datos */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { method: "GET", ...options })
  }

  /** POST — enviar datos JSON */
  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    })
  }

  /** PUT — actualizar datos JSON */
  async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    })
  }

  /** PATCH — actualización parcial */
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    })
  }

  /** DELETE — eliminar recurso */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { method: "DELETE", ...options })
  }

  /**
   * POST multipart/form-data — para subida de archivos (fotos faciales).
   * NO poner Content-Type manualmente; el navegador lo agrega con el boundary.
   */
  async postForm<T>(path: string, form: FormData, options?: RequestOptions): Promise<T> {
    const { timeout = 15000, retries = 0, headers = {} } = options ?? {}
    const url = `${this.baseURL}${path}`
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          method: "POST",
          body: form,
          headers, // sin Content-Type para que el browser ponga el boundary
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return await this.handleResponse<T>(response)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt === retries) throw lastError
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
      }
    }

    throw lastError || new Error("Unknown error")
  }

  // ── Privado ────────────────────────────────────────────────────────────────

  private async request<T>(
    path: string,
    options: Omit<RequestInit, "headers"> & RequestOptions
  ): Promise<T> {
    const { timeout = 10000, retries = 0, headers = {}, ...fetchOptions } = options
    const url = `${this.baseURL}${path}`

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers: defaultHeaders,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return await this.handleResponse<T>(response)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt === retries) throw lastError
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
      }
    }

    throw lastError || new Error("Unknown error")
  }

  /**
   * Maneja la respuesta HTTP.
   * El backend usa la envoltura { ok, data, message }.
   * Si ok=true → devuelve data. Si ok=false → lanza error con message.
   * Si la respuesta no tiene la envoltura (ej. 204 No Content) → retorna undefined.
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // 204 No Content — sin body
    if (response.status === 204) return undefined as T

    const json = await response.json().catch(() => null)

    // Respuesta estándar del backend Lumina: { ok, data, message }
    if (json !== null && typeof json === "object" && "ok" in json) {
      const wrapped = json as ApiResponse<T>
      if (wrapped.ok) {
        return wrapped.data
      }
      const error = Object.assign(
        new Error(wrapped.message || `HTTP ${response.status}`),
        { status: response.status, body: json }
      ) as HttpError
      throw error
    }

    // Respuesta sin envoltura (ej. backend devuelve directamente el objeto)
    if (!response.ok) {
      const error = Object.assign(
        new Error(`HTTP ${response.status}`),
        { status: response.status, body: json }
      ) as HttpError
      throw error
    }

    return json as T
  }
}

/** Singleton exportado */
export const httpClient = new HttpClient()
