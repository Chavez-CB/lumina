/**
 * Tipos de la API REST del backend Lumina
 *
 * El backend siempre responde con esta envoltura estándar:
 *   { ok: boolean, message: string, data: T, meta?: PaginaMeta }
 */

/** Envoltura estándar de todas las respuestas del backend */
export interface ApiResponse<T> {
  ok: boolean
  message: string
  data: T
  meta?: PaginaMeta
  errors?: Array<{ campo: string; mensaje: string }>
}

/** Metadatos de paginación (presente en listados) */
export interface PaginaMeta {
  total: number
  pagina: number
  limite: number
  paginas: number
}

/** Parámetros de query para listados paginados */
export interface ListQueryParams {
  pagina?: number
  limite?: number
  buscar?: string
  activo?: 0 | 1
}
