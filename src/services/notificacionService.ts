/**
 * Notificacion Service — Alertas del día derivadas de asistencias reales
 *
 * Deriva de GET /api/asistencias (filtrado por fecha de hoy)
 * y GET /api/empleados para saber quién debería haber marcado.
 */

import { attendanceService } from "@/services/attendanceService"
import { empleadoService } from "@/services/empleadoService"

export type TipoNotificacion = "tardanza" | "ausencia" | "sin_marcar"

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  empleadoId: string
  nombre: string
  hora?: string
  fecha: string
}

class NotificacionService {
  private _leidas = new Set<string>()

  /**
   * Obtiene las notificaciones del día actual comparando
   * los empleados activos con sus asistencias registradas.
   */
  async getNotificaciones(): Promise<Notificacion[]> {
    const hoy = new Date().toISOString().slice(0, 10)
    const horaActual = new Date().getHours() * 60 + new Date().getMinutes()

    try {
      const [empleados, asistenciasHoy] = await Promise.all([
        empleadoService.getAll({ activo: 1 }),
        attendanceService.getByFecha(hoy),
      ])

      const result: Notificacion[] = []

      empleados.forEach(emp => {
        const asist = asistenciasHoy.find(a => a.empleadoId === emp.id)

        if (!asist) {
          // Sin marcar — solo alertar si ya pasó la hora de entrada + 30 min
          const [h, m] = emp.horarioEntrada.split(":").map(Number)
          if (horaActual > h * 60 + m + 30) {
            const id = `sin-${emp.id}`
            if (!this._leidas.has(id)) {
              result.push({ id, tipo: "sin_marcar", empleadoId: emp.id, nombre: emp.nombre, fecha: hoy })
            }
          }
        } else if (asist.estado === "tardanza") {
          const id = `tard-${asist.id}`
          if (!this._leidas.has(id)) {
            result.push({ id, tipo: "tardanza", empleadoId: emp.id, nombre: emp.nombre, hora: asist.entrada ?? undefined, fecha: hoy })
          }
        } else if (asist.estado === "ausente") {
          const id = `aus-${asist.id}`
          if (!this._leidas.has(id)) {
            result.push({ id, tipo: "ausencia", empleadoId: emp.id, nombre: emp.nombre, fecha: hoy })
          }
        }
      })

      return result
    } catch {
      return []
    }
  }

  marcarTodasLeidas(notificaciones: Notificacion[]): void {
    notificaciones.forEach(n => this._leidas.add(n.id))
  }
}

export const notificacionService = new NotificacionService()
