/**
 * Attendance Service — Registro de asistencia facial de empleados
 *
 * Diferente de facialService.ts (que es para login de admins).
 * Este servicio registra la asistencia via reconocimiento facial.
 *
 * POST /api/asistencias/registrar-facial  — multipart/form-data { file, area_id, threshold? }
 * GET  /api/asistencias                   — listar asistencias (paginado)
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
  confianza_facial?: number
  // Datos del empleado (cuando el backend hace JOIN)
  persona_nombre?: string
  foto_url?: string
  cargo?: string
  area_nombre?: string
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
  confianzaFacial?: number
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
    confianzaFacial: b.confianza_facial,
    nombreEmpleado: b.persona_nombre,
    fotoEmpleado: b.foto_url,
    cargoEmpleado: b.cargo,
    areaEmpleado: b.area_nombre,
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
   *
   * Envía la foto como multipart/form-data al endpoint /registrar-facial
   * que realiza el reconocimiento y el registro de asistencia en un solo paso.
   *
   * Campos del FormData:
   *   file     — imagen JPEG capturada de la cámara
   *   area_id  — ID del área donde se realiza la marcación (obligatorio)
   *   threshold — umbral de similitud facial (default 0.55)
   */
  async register(payload: AttendancePayload): Promise<AttendanceResponse> {
    try {
      const fotoBlob = base64ToBlob(payload.frameBase64)
      const form = new FormData()
      form.append("file", fotoBlob, "captura.jpg")
      form.append("area_id", payload.areaId ?? "1")
      form.append("threshold", "0.55")

      if (payload.metadata) {
        form.append("calidad", payload.metadata.quality)
        form.append("confianza", payload.metadata.confidence.toString())
      }

      const data = await httpClient.postForm<AttendanceResponse>(
        "/asistencias/registrar-facial",
        form,
        { timeout: 20000 }
      )

      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      return { found: false, error: `Error al registrar asistencia: ${message}` }
    }
  }

  /**
   * Obtener listado de asistencias.
   * @param fecha      - Filtrar por fecha exacta (yyyy-mm-dd)
   * @param persona_id - Filtrar por persona
   * @param estado     - Filtrar por estado
   * @param limite     - Máximo de registros (default 500)
   */
  async getAll(params: {
    fecha?: string
    persona_id?: string
    estado?: string
    limite?: number
    pagina?: number
  } = {}): Promise<Asistencia[]> {
    const query = new URLSearchParams()
    query.set("limite", String(params.limite ?? 500))
    if (params.pagina)    query.set("pagina",     String(params.pagina))
    if (params.fecha)     query.set("fecha",      params.fecha)
    if (params.persona_id) query.set("persona_id", params.persona_id)
    if (params.estado)    query.set("estado",     params.estado)

    const res = await httpClient.get<{ ok: boolean; data: AsistenciaBackend[] }>(`/asistencias?${query}`)
    const lista = (res as unknown as AsistenciaBackend[]) ?? (res as { data: AsistenciaBackend[] })?.data ?? []
    return Array.isArray(lista) ? lista.map(backendToAsistencia) : []
  }

  /**
   * Obtener asistencias de una fecha específica.
   */
  async getByFecha(fecha: string): Promise<Asistencia[]> {
    return this.getAll({ fecha })
  }

  /**
   * Obtener asistencias de un empleado específico.
   */
  async getByEmpleado(persona_id: string): Promise<Asistencia[]> {
    return this.getAll({ persona_id })
  }
}

export const attendanceService = new AttendanceService()
