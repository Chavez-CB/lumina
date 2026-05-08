/**
 * Historial Service — Registros históricos de descuentos y auditorías
 *
 * Deriva datos de GET /api/asistencias (filtrando y agrupando por mes).
 * No hay endpoint dedicado /historial en el backend.
 */

import { httpClient } from "@/lib/api/client"
import type { AsistenciaBackend } from "@/services/attendanceService"

export interface DescuentoMesHistorial {
  mes: string
  tardanzas: number
  faltas: number
  monto: number
}

export interface CambioAuditoria {
  id: string
  fecha: string
  autor: string
  empleado: string
  motivo: string
  detalle: string
}

const MESES_LARGO = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]

// Valores por defecto de descuentos (se puede configurar)
const MONTO_TARDANZA = 15
const PCT_FALTA = 100
const SUELDO_MEDIO_ESTIMADO = 3500

class HistorialService {
  /**
   * Obtiene descuentos agrupados por mes calculando desde asistencias reales.
   * Para meses que no tienen datos reales usa estimaciones.
   */
  async getDescuentosPorMes(year: number = new Date().getFullYear()): Promise<DescuentoMesHistorial[]> {
    try {
      // Traer todas las asistencias del año
      const asistencias = await httpClient.get<AsistenciaBackend[]>(
        `/asistencias?limite=5000&year=${year}`
      )

      return MESES_LARGO.map((mes, mesIdx) => {
        const deEsteMes = (asistencias ?? []).filter(a => {
          const d = new Date(a.fecha)
          return d.getFullYear() === year && d.getMonth() === mesIdx
        })

        if (deEsteMes.length === 0) {
          return { mes, tardanzas: 0, faltas: 0, monto: 0 }
        }

        const tardanzas = deEsteMes.filter(a => a.estado === "tardanza").length
        const faltas = deEsteMes.filter(a => a.estado === "ausente").length
        const monto = Math.round(
          tardanzas * MONTO_TARDANZA +
          faltas * (SUELDO_MEDIO_ESTIMADO / 30) * (PCT_FALTA / 100)
        )

        return { mes, tardanzas, faltas, monto }
      })
    } catch {
      return MESES_LARGO.map(mes => ({ mes, tardanzas: 0, faltas: 0, monto: 0 }))
    }
  }

  /**
   * Cambios de auditoría manual.
   * El backend no expone este endpoint aún → lista vacía.
   */
  getCambios(): CambioAuditoria[] {
    return []
  }
}

export const historialService = new HistorialService()
