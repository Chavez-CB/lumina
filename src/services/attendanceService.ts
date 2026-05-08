/**
 * Attendance Service — Registro de asistencia facial de empleados
 *
 * Diferente de facialService.ts (login de admins).
 * Este servicio registra la asistencia via reconocimiento facial.
 *
 * POST /api/asistencias/registrar  — multipart/form-data con campo "foto"
 * GET  /api/asistencias            — listar asistencias (paginado)
 */

import type { AttendancePayload, AttendanceResponse } from "@/types/attendance"
import type { EstadoAsistencia } from "@/types/asistencia"
import { httpClient } from "@/lib/api/client"

// ── Tipo crudo del backend ────────────────────────────────────────────────

export interface AsistenciaBackend {
  id: number
  persona_id: number
  fecha: string
  hora_entrada: string | null
  hora_salida: string | null
  horas_trabajadas: number
  estado: EstadoAsistencia
  metodo: string
  // Datos del empleado (cuando el backend hace JOIN)
  nombres?: string
  apellidos?: string
  foto_url?: string
  cargo?: string
  area?: string
}

// ── Tipo del frontend ─────────────────────────────────────────────────────

export interface Asistencia {
  id: string
  empleadoId: string
  fecha: string
  entrada: string | null
  salida: string | null
  horasTrabajadas: number
  estado: EstadoAsistencia
  metodo: "facial"
  // Datos del empleado (si el backend los incluye)
  nombreEmpleado?: string
  fotoEmpleado?: string
  cargoEmpleado?: string
  areaEmpleado?: string
}

// ── Adaptador ─────────────────────────────────────────────────────────────

export function backendToAsistencia(b: AsistenciaBackend): Asistencia {
  return {
    id: String(b.id),
    empleadoId: String(b.persona_id),
    fecha: b.fecha,
    entrada: b.hora_entrada,
    salida: b.hora_salida,
    horasTrabajadas: b.horas_trabajadas ?? 0,
    estado: b.estado,
    metodo: "facial",
    nombreEmpleado: b.nombres && b.apellidos ? `${b.nombres} ${b.apellidos}`.trim() : undefined,
    fotoEmpleado: b.foto_url,
    cargoEmpleado: b.cargo,
    areaEmpleado: b.area,
  }
}

/**
 * Convierte base64 (con o sin prefijo data:) a Blob JPEG.
 * Necesario para construir el FormData de multipart.
 */
export function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const binary = atob(base64.replace(/^data:[^;]+;base64,/, ""))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

// ── Servicio ──────────────────────────────────────────────────────────────

class AttendanceService {
  /**
   * Registrar asistencia facial.
   * Envía la foto como multipart/form-data al backend.
   */
  async register(payload: AttendancePayload): Promise<AttendanceResponse> {
    try {
      const fotoBlob = base64ToBlob(payload.frameBase64)
      const form = new FormData()
      form.append("foto", fotoBlob, "captura.jpg")
      form.append("timestamp", payload.timestamp.toString())

      if (payload.metadata) {
        form.append("calidad", payload.metadata.quality)
        form.append("confianza", payload.metadata.confidence.toString())
        form.append("resolucion", payload.metadata.resolution.join("x"))
      }

      const data = await httpClient.postForm<AttendanceResponse>(
        "/asistencias/registrar",
        form,
        { timeout: 20000 }
      )

      return { ...data, success: data.success ?? true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      return { success: false, error: `Error al registrar asistencia: ${message}` }
    }
  }

  /**
   * Obtener listado de asistencias.
   * @param fecha  - Filtrar por fecha exacta (yyyy-mm-dd)
   * @param limite - Máximo de registros (default 500)
   */
  async getAll(params: { fecha?: string; limite?: number; pagina?: number } = {}): Promise<Asistencia[]> {
    const query = new URLSearchParams()
    query.set("limite", String(params.limite ?? 500))
    if (params.pagina) query.set("pagina", String(params.pagina))
    if (params.fecha) query.set("fecha", params.fecha)

    const lista = await httpClient.get<AsistenciaBackend[]>(`/asistencias?${query}`)
    return Array.isArray(lista) ? lista.map(backendToAsistencia) : []
  }

  /**
   * Obtener asistencias de una fecha específica.
   */
  async getByFecha(fecha: string): Promise<Asistencia[]> {
    return this.getAll({ fecha })
  }
}

export const attendanceService = new AttendanceService()
