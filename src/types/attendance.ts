/**
 * Types para el sistema de Asistencia Facial
 * Separado de facial.ts (que es para autenticación de admins)
 */

/** Payload enviado al backend para registrar asistencia */
export interface AttendancePayload {
  frameBase64: string
  timestamp: number
  metadata?: {
    resolution: [number, number]
    quality: "low" | "medium" | "high"
    confidence: number
  }
}

/** Respuesta del backend al registrar asistencia */
export interface AttendanceResponse {
  success: boolean
  employee?: {
    id: string
    nombre: string
    username: string
  }
  timestamp?: string
  shift?: "mañana" | "tarde" | "noche"
  error?: string
}

/** Estado del hook/componente de asistencia */
export interface AttendanceState {
  isLoading: boolean
  isRecognizing: boolean
  isSuccess: boolean
  error: string | null
  recognitionProgress: number
  result: AttendanceResponse | null
}
