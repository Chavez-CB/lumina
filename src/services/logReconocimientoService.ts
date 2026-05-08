/**
 * Log Reconocimiento Service — Historial de intentos de reconocimiento facial
 *
 * Consume GET /api/logs/reconocimiento con filtros opcionales.
 * Útil para diagnóstico: detectar fallos recurrentes, tiempos de respuesta, confianza.
 *
 * Endpoints:
 *   GET /api/logs/reconocimiento              → listado paginado
 *   GET /api/logs/reconocimiento/:id          → detalle
 *   GET /api/logs/reconocimiento/persona/:id  → logs de una persona
 */

import { httpClient } from "@/lib/api/client"
import type { PaginaMeta } from "@/types/api"

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface LogReconocimiento {
  id: number
  persona_id: number | null
  persona_nombre: string | null
  area_id: number | null
  area_nombre: string | null
  endpoint: string
  metodo: string
  exito: 0 | 1
  mensaje: string | null
  faces_detected: number | null
  distancia: number | null
  confidence: number | null
  tiempo_respuesta_ms: number | null
  ip_address: string | null
  created_at: string
}

export interface LogReconocimientoFiltros {
  fecha_desde?: string   // yyyy-mm-dd
  fecha_hasta?: string
  exito?: 0 | 1
  persona_id?: number
  area_id?: number
  endpoint?: string
  pagina?: number
  limite?: number
}

// ── Servicio ──────────────────────────────────────────────────────────────

class LogReconocimientoService {
  /**
   * Listar logs con filtros y paginación.
   */
  async getAll(filtros: LogReconocimientoFiltros = {}): Promise<{
    logs: LogReconocimiento[]
    meta: PaginaMeta
  }> {
    const query = new URLSearchParams()
    if (filtros.pagina)      query.set("pagina",      String(filtros.pagina))
    if (filtros.limite)      query.set("limite",      String(filtros.limite))
    if (filtros.fecha_desde) query.set("fecha_desde", filtros.fecha_desde)
    if (filtros.fecha_hasta) query.set("fecha_hasta", filtros.fecha_hasta)
    if (filtros.exito !== undefined) query.set("exito", String(filtros.exito))
    if (filtros.persona_id)  query.set("persona_id",  String(filtros.persona_id))
    if (filtros.area_id)     query.set("area_id",     String(filtros.area_id))
    if (filtros.endpoint)    query.set("endpoint",    filtros.endpoint)

    const res = await httpClient.get<{ ok: boolean; data: LogReconocimiento[]; meta: PaginaMeta }>(
      `/logs/reconocimiento?${query}`
    )

    const data = (res as { data: LogReconocimiento[]; meta: PaginaMeta })
    return {
      logs: Array.isArray(data.data) ? data.data : [],
      meta: data.meta ?? { total: 0, pagina: 1, limite: 20, paginas: 0 },
    }
  }

  /**
   * Obtener logs de un empleado específico.
   */
  async getByPersona(persona_id: number): Promise<LogReconocimiento[]> {
    const res = await httpClient.get<{ ok: boolean; data: LogReconocimiento[] }>(
      `/logs/reconocimiento/persona/${persona_id}`
    )
    const data = (res as { data: LogReconocimiento[] })
    return Array.isArray(data.data) ? data.data : []
  }

  /**
   * Calcular métricas de resumen de los logs.
   * Útil para mostrar en un panel de diagnóstico.
   */
  calcularResumen(logs: LogReconocimiento[]): {
    total: number
    exitosos: number
    fallidos: number
    tasaExito: string
    tiempoPromedio: string
    confianzaPromedio: string
  } {
    const total = logs.length
    const exitosos = logs.filter(l => l.exito === 1).length
    const fallidos = total - exitosos

    const tiempos = logs.filter(l => l.tiempo_respuesta_ms != null).map(l => l.tiempo_respuesta_ms!)
    const tiempoPromedio = tiempos.length
      ? `${Math.round(tiempos.reduce((s, t) => s + t, 0) / tiempos.length)} ms`
      : "—"

    const confianzas = logs.filter(l => l.confidence != null).map(l => l.confidence!)
    const confianzaPromedio = confianzas.length
      ? `${(confianzas.reduce((s, c) => s + c, 0) / confianzas.length * 100).toFixed(1)}%`
      : "—"

    return {
      total,
      exitosos,
      fallidos,
      tasaExito: total > 0 ? `${((exitosos / total) * 100).toFixed(1)}%` : "—",
      tiempoPromedio,
      confianzaPromedio,
    }
  }
}

export const logReconocimientoService = new LogReconocimientoService()
