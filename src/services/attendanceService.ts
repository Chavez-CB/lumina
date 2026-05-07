/**
 * Attendance Service — Registro de asistencia facial de empleados
 *
 * Diferente de facialService.ts (login de admins).
 * Este servicio registra la asistencia via reconocimiento facial.
 *
 * El backend recibe la foto como multipart/form-data con el campo "foto".
 * La foto es un Blob JPEG extraido del video en el momento de la captura.
 *
 * HOY: Mock 90% exito, ignora el payload
 * FUTURO: POST /attendance/facial  (multipart/form-data)
 */

import type { AttendancePayload, AttendanceResponse } from "@/types/attendance"
// import { httpClient } from "@/lib/api/client"

/**
 * Convierte un string base64 (sin prefijo data:) a Blob JPEG.
 * Util para construir el FormData que espera el backend.
 */
export function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const binary = atob(base64.replace(/^data:[^;]+;base64,/, ""))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

class AttendanceService {
  async register(payload: AttendancePayload): Promise<AttendanceResponse> {
    try {
      // ====== HOY (SIN BACKEND) ======
      return await this.mockRegister(payload)

      // ====== FUTURO (CON BACKEND) ======
      // La foto se envía como multipart/form-data para que el backend pueda
      // comparar directamente el Blob con las fotos almacenadas.
      //
      // const fotoBlob = base64ToBlob(payload.frameBase64)
      // const form = new FormData()
      // form.append("foto", fotoBlob, "captura.jpg")
      // form.append("timestamp", payload.timestamp.toString())
      // if (payload.metadata) {
      //   form.append("calidad", payload.metadata.quality)
      //   form.append("confianza", payload.metadata.confidence.toString())
      //   form.append("resolucion", payload.metadata.resolution.join("x"))
      // }
      // return await httpClient.postForm<AttendanceResponse>("/attendance/facial", form, { timeout: 15000 })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: `Error al registrar asistencia: ${message}` }
    }
  }

  private detectShift(): "mañana" | "tarde" | "noche" {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 14) return "mañana"
    if (hour >= 14 && hour < 22) return "tarde"
    return "noche"
  }

  private mockRegister(_payload: AttendancePayload): Promise<AttendanceResponse> {
    const delay = Math.random() * 300 + 200
    return new Promise(resolve => {
      setTimeout(() => {
        const success = Math.random() > 0.1
        if (success) {
          resolve({
            success: true,
            employee: { id: "emp_001", nombre: "Carlos Mendoza", username: "carlos.mendoza" },
            timestamp: new Date().toISOString(),
            shift: this.detectShift(),
          })
        } else {
          resolve({ success: false, error: "Rostro no reconocido en la base de datos" })
        }
      }, delay)
    })
  }
}

export const attendanceService = new AttendanceService()
