/**
 * Historial Service — Datos historicos reales de descuentos y auditorias
 *
 * HOY: mes actual con datos reales de getAsistencias(), meses pasados seeded
 * FUTURO: GET /historial/descuentos, GET /historial/cambios
 */

import { getAsistencias, empleados, configDescuentos, seededRandom } from "@/lib/mockData"
// import { httpClient } from "@/lib/api/client"

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

const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

class HistorialService {
  getDescuentosPorMes(year: number = new Date().getFullYear()): DescuentoMesHistorial[] {
    // FUTURO: return await httpClient.get<DescuentoMesHistorial[]>(`/historial/descuentos?year=${year}`)
    const mesActual = new Date().getMonth()
    const sueldoMedio = empleados.reduce((s, e) => s + e.sueldoBase, 0) / empleados.length
    const asist = getAsistencias()
    const tardReal = asist.filter(a => a.estado === "tardanza").length
    const faltaReal = asist.filter(a => a.estado === "ausente").length
    const montoReal = Math.round(
      tardReal * configDescuentos.montoTardanza +
      faltaReal * (sueldoMedio / 30) * (configDescuentos.porcentajeFalta / 100)
    )

    return MESES_LARGO.map((mes, i) => {
      if (i === mesActual) {
        return { mes, tardanzas: tardReal, faltas: faltaReal, monto: montoReal }
      }
      const r = seededRandom(year * 200 + i)
      const t = Math.round(empleados.length * (2 + r() * 3))
      const f = Math.round(empleados.length * r())
      return {
        mes,
        tardanzas: t,
        faltas: f,
        monto: Math.round(t * configDescuentos.montoTardanza + f * (sueldoMedio / 30)),
      }
    })
  }

  getCambios(): CambioAuditoria[] {
    // FUTURO: return await httpClient.get<CambioAuditoria[]>("/historial/cambios")
    return [] // Sin cambios hasta que el backend los registre
  }
}

export const historialService = new HistorialService()
