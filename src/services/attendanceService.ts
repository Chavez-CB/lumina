/**
 * Attendance Service — Registro de asistencia facial de empleados
 *
 * Diferente de facialService.ts (login de admins).
 * Este servicio registra la asistencia vía reconocimiento facial.
 *
 * HOY: Mock 90% éxito
 * FUTURO: POST /attendance/facial
 */

import type { AttendancePayload, AttendanceResponse } from "@/types/attendance"
// import { httpClient } from "@/lib/api/client"  // descomentar con backend real

class AttendanceService {
  async register(payload: AttendancePayload): Promise<AttendanceResponse> {
    try {
      // ====== HOY (SIN BACKEND) ======
      return await this.mockRegister(payload)

      // ====== FUTURO (CON BACKEND) ======
      // return await httpClient.post<AttendanceResponse>(
      //   "/attendance/facial",
      //   payload,
      //   { timeout: 15000 }
      // )
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
