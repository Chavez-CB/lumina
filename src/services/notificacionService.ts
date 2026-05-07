/**
 * Notificacion Service — Alertas del dia derivadas de asistencias reales
 *
 * HOY: deriva de getAsistencias() y empleados
 * FUTURO: GET /notificaciones
 */

import { getAsistencias, empleados, fechaHoy } from "@/lib/mockData"
// import { httpClient } from "@/lib/api/client"

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

  getNotificaciones(): Notificacion[] {
    // ====== HOY ======
    const hoy = fechaHoy()
    const asistHoy = getAsistencias().filter(a => a.fecha === hoy)
    const result: Notificacion[] = []
    const horaActual = new Date().getHours() * 60 + new Date().getMinutes()

    empleados.filter(e => e.activo).forEach(emp => {
      const a = asistHoy.find(x => x.empleadoId === emp.id)
      if (!a) {
        const [h, m] = emp.horarioEntrada.split(":").map(Number)
        if (horaActual > h * 60 + m + 30) {
          const id = `sin-${emp.id}`
          if (!this._leidas.has(id))
            result.push({ id, tipo: "sin_marcar", empleadoId: emp.id, nombre: emp.nombre, fecha: hoy })
        }
      } else if (a.estado === "tardanza") {
        const id = `tard-${a.id}`
        if (!this._leidas.has(id))
          result.push({ id, tipo: "tardanza", empleadoId: emp.id, nombre: emp.nombre, hora: a.entrada ?? undefined, fecha: hoy })
      } else if (a.estado === "ausente") {
        const id = `aus-${a.id}`
        if (!this._leidas.has(id))
          result.push({ id, tipo: "ausencia", empleadoId: emp.id, nombre: emp.nombre, fecha: hoy })
      }
    })

    return result
    // FUTURO: return await httpClient.get<Notificacion[]>("/notificaciones")
  }

  marcarTodasLeidas(): void {
    this.getNotificaciones().forEach(n => this._leidas.add(n.id))
  }
}

export const notificacionService = new NotificacionService()
