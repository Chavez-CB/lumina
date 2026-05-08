/**
 * Types para el sistema de Asistencia Facial de empleados
 * Separado de facial.ts (que es para autenticación de admins)
 *
 * Shape del backend: POST /api/asistencias/registrar-facial
 */

/** Payload que enviamos al backend (multipart/form-data) */
export interface AttendancePayload {
  frameBase64: string
  timestamp: number
  areaId?: string
  metadata?: {
    resolution?: [number, number]
    quality: string
    confidence: number
  }
}

/**
 * Respuesta del backend al registrar asistencia facial.
 *
 * Campos principales:
 *   ok       — siempre presente
 *   found    — true si se reconoció un rostro
 *   nombre   — nombre completo si found = true
 *   tipo     — "entrada" | "salida"
 *   face     — métricas de la comparación facial
 *   employee — shape legacy (FacialAttendance modal)
 */
export interface AttendanceResponse {
  ok?: boolean
  found?: boolean
  persona_id?: number
  nombre?: string
  mensaje?: string
  tipo?: "entrada" | "salida"
  asistencia?: {
    id: number
    fecha: string
    hora_entrada?: string | null
    hora_salida?: string | null
    estado?: string
    confianza_facial?: number
  }
  face?: {
    distance: number
    confidence: number
  }
  // Shape legacy (modal FacialAttendance / useFacialAttendance)
  success?: boolean
  employee?: {
    id: string
    nombre: string
    username: string
  }
  timestamp?: string
  shift?: "mañana" | "tarde" | "noche"
  // Para errores de red / fallback
  error?: string
  mejor_distancia?: number
}

/** Estado interno del hook useFacialAttendance */
export interface AttendanceState {
  isLoading: boolean
  isRecognizing: boolean
  isSuccess: boolean
  error: string | null
  recognitionProgress: number
  result: AttendanceResponse | null
}
