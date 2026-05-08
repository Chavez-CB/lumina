/**
 * Types para el sistema de Asistencia Facial de empleados
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

/** Empleado reconocido (retornado por el backend al registrar asistencia) */
export interface AttendanceEmployee {
  id: string
  nombre: string
  username?: string
  cargo?: string
  foto_url?: string
}

/** Respuesta del backend al registrar asistencia */
export interface AttendanceResponse {
  success: boolean
  employee?: AttendanceEmployee
  timestamp?: string
  tipo?: "entrada" | "salida"
  shift?: "mañana" | "tarde" | "noche"
  estado?: "puntual" | "tardanza"
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
