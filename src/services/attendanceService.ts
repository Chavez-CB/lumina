/**
 * Attendance Service — Registro y consulta de asistencias
 *
 * Backend:
 *   POST /api/asistencias/registrar-facial  ← multipart: file + area_id + threshold
 *   POST /api/asistencias/registrar         ← manual: persona_id, horario_id, area_id, fecha...
 *   GET  /api/asistencias                   ← { ok, data: [...], meta: {...} }
 *
 * Schema real (PostgreSQL):
 *   id              SERIAL
 *   persona_id      INT
 *   horario_id      INT
 *   area_id         INT
 *   fecha           DATE        "yyyy-mm-dd"
 *   hora_entrada    TIME
 *   hora_salida     TIME
 *   estado          VARCHAR     'puntual'|'tardanza'|'ausente'|'justificado'
 *   metodo_registro VARCHAR     'facial'|'manual'|'qr'|'rfid'
 *   observacion     TEXT
 *   registrado_por  INT
 *   -- Campos JOIN en el GET listado --
 *   persona_nombre  VARCHAR
 *   horario_nombre  VARCHAR
 *   area_nombre     VARCHAR
 */

import { httpClient } from "@/lib/api/client"

// ── Tipos backend ──────────────────────────────────────────────────────────

export interface AsistenciaBackend {
  id: number
  persona_id: number
  horario_id: number
  area_id: number | null
  fecha: string
  hora_entrada: string | null
  hora_salida: string | null
  estado: string
  metodo_registro: string
  observacion: string | null
  // Campos de JOIN
  persona_nombre?: string
  horario_nombre?: string
  area_nombre?: string
  // campos legacy (por si el backend los pone)
  cargo?: string
}

// ── Tipo frontend ──────────────────────────────────────────────────────────

export interface Asistencia {
  id: string
  empleadoId: string
  fecha: string
  horaEntrada: string
  horaSalida: string
  estado: "puntual" | "tardanza" | "ausente" | "justificado"
  metodo: string
  observacion: string
  nombreEmpleado: string
  horarioNombre: string
  areaNombre: string
  cargoEmpleado?: string
  // ── Aliases para compatibilidad con vistas ─────────────────────────────
  entrada: string        // alias de horaEntrada
  salida: string         // alias de horaSalida
  horasTrabajadas: number // calculado
  fotoEmpleado?: string
  areaEmpleado: string   // alias de areaNombre
}

// ── Payload para registro facial ───────────────────────────────────────────

export interface AttendancePayload {
  frameBase64: string
  areaId?: string
  timestamp?: number
  metadata?: {
    resolution?: [number, number]
    quality: string
    confidence: number
  }
}

// ── Respuesta de /registrar-facial ────────────────────────────────────────

export interface AttendanceResponse {
  found: boolean
  ok?: boolean
  message?: string
  error?: string
  persona_id?: number
  nombre?: string
  // Tipo de marcación detectado por el backend
  tipo?: "entrada" | "salida"
  // Datos de la asistencia registrada
  asistencia?: {
    id: number
    fecha: string
    hora_entrada?: string | null
    hora_salida?: string | null
    estado?: string
    confianza_facial?: number
  }
  // Métricas de comparación facial
  face?: {
    distance: number
    confidence: number
  }
  mejor_distancia?: number
  // Campos legacy (hook useFacialAttendance)
  success?: boolean
  employee?: { id: string; nombre: string; username: string }
  timestamp?: string
  shift?: "mañana" | "tarde" | "noche"
}

// ── Adaptador ──────────────────────────────────────────────────────────────

function calcularHoras(entrada: string, salida: string): number {
  if (!entrada || !salida) return 0
  const [eh, em] = entrada.split(":").map(Number)
  const [sh, sm] = salida.split(":").map(Number)
  const mins = (sh * 60 + sm) - (eh * 60 + em)
  return mins > 0 ? +(mins / 60).toFixed(2) : 0
}

function backendToAsistencia(b: AsistenciaBackend): Asistencia {
  const horaEntrada = b.hora_entrada ?? ""
  const horaSalida  = b.hora_salida  ?? ""
  return {
    id: String(b.id),
    empleadoId: String(b.persona_id),
    fecha: b.fecha,
    horaEntrada,
    horaSalida,
    estado: (b.estado as Asistencia["estado"]) ?? "ausente",
    metodo: b.metodo_registro ?? "manual",
    observacion: b.observacion ?? "",
    nombreEmpleado: b.persona_nombre ?? "",
    horarioNombre: b.horario_nombre ?? "",
    areaNombre: b.area_nombre ?? "",
    cargoEmpleado: b.cargo,
    // aliases
    entrada: horaEntrada,
    salida: horaSalida,
    horasTrabajadas: calcularHoras(horaEntrada, horaSalida),
    fotoEmpleado: undefined,
    areaEmpleado: b.area_nombre ?? "",
  }
}

/**
 * Convierte base64 (con o sin prefijo data:) a Blob JPEG.
 */
export function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const binary = atob(base64.replace(/^data:[^;]+;base64,/, ""))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

// ── Tipo de respuesta del listado ─────────────────────────────────────────

type ListResponse =
  | { ok: boolean; data: AsistenciaBackend[]; meta?: unknown }
  | AsistenciaBackend[]

function unwrapList(res: ListResponse): AsistenciaBackend[] {
  if (Array.isArray(res)) return res
  const wrapped = res as { data?: AsistenciaBackend[] }
  return Array.isArray(wrapped.data) ? wrapped.data : []
}

// ── Servicio ───────────────────────────────────────────────────────────────

class AttendanceService {
  /**
   * Registrar asistencia facial.
   *
   * Envía la foto como multipart/form-data al endpoint /registrar-facial.
   * Campos del FormData:
   *   file      — imagen JPEG capturada de la cámara
   *   area_id   — ID del área donde se realiza la marcación (obligatorio)
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
   * Obtener listado de asistencias con filtros.
   *
   * @param fecha       Filtrar por fecha exacta (yyyy-mm-dd)
   * @param persona_id  Filtrar por persona
   * @param estado      Filtrar por estado ('puntual'|'tardanza'|'ausente'|'justificado')
   * @param limite      Máximo de registros (default 500)
   * @param pagina      Página (default 1)
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
    if (params.pagina)     query.set("pagina",      String(params.pagina))
    if (params.fecha)      query.set("fecha",        params.fecha)
    if (params.persona_id) query.set("persona_id",   params.persona_id)
    if (params.estado)     query.set("estado",       params.estado)

    const res = await httpClient.get<ListResponse>(`/asistencias?${query}`)
    return unwrapList(res).map(backendToAsistencia)
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
