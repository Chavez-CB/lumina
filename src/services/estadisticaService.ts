/**
 * Estadistica Service — Calculo de metricas reales
 *
 * Reemplaza los Math.random() de Estadisticas.tsx con datos derivados
 * de las asistencias reales y calculos deterministas seeded.
 *
 * HOY: deriva datos de getAsistencias() + seededRandom para meses historicos
 * FUTURO: GET /estadisticas/resumen, /estadisticas/evolucion, /estadisticas/descuentos
 */

import { getAsistencias, empleados, configDescuentos, seededRandom } from "@/lib/mockData"
// import { httpClient } from "@/lib/api/client"

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export interface EvolucionMes {
  mes: string
  asistencia: number
}

export interface DescuentoMes {
  mes: string
  Descuentos: number
}

class EstadisticaService {
  /**
   * Evolucion anual de porcentaje de asistencia
   * Mes actual: datos reales. Meses anteriores: seeded determinista.
   */
  getEvolucionAnual(year: number = new Date().getFullYear()): EvolucionMes[] {
    // FUTURO: return await httpClient.get<EvolucionMes[]>(`/estadisticas/evolucion?year=${year}`)
    const mesActual = new Date().getMonth()
    const asist = getAsistencias()
    const total = asist.length || 1
    const presentes = asist.filter(a => a.estado !== "ausente" && a.estado !== "justificado").length
    const pctReal = Math.round(presentes / total * 100)

    return MESES.map((mes, i) => {
      if (i === mesActual) {
        return { mes, asistencia: pctReal }
      }
      const rand = seededRandom(year * 100 + i)
      return { mes, asistencia: 80 + Math.round(Math.sin(i / 1.5) * 8 + rand() * 5) }
    })
  }

  /**
   * Descuentos totales por mes
   * Mes actual: calculado desde asistencias reales. Meses anteriores: seeded.
   */
  getDescuentosPorMes(year: number = new Date().getFullYear()): DescuentoMes[] {
    // FUTURO: return await httpClient.get<DescuentoMes[]>(`/estadisticas/descuentos?year=${year}`)
    const mesActual = new Date().getMonth()
    const sueldoMedio = empleados.reduce((s, e) => s + e.sueldoBase, 0) / empleados.length
    const asist = getAsistencias()
    const tardanzas = asist.filter(a => a.estado === "tardanza").length
    const faltas = asist.filter(a => a.estado === "ausente").length
    const totalReal = Math.round(
      tardanzas * configDescuentos.montoTardanza +
      faltas * (sueldoMedio / 30) * (configDescuentos.porcentajeFalta / 100)
    )

    return MESES.map((mes, i) => {
      if (i === mesActual) {
        return { mes, Descuentos: totalReal }
      }
      const rand = seededRandom(year * 100 + i + 50)
      return { mes, Descuentos: 800 + Math.round(Math.cos(i / 1.7) * 300 + rand() * 250) }
    })
  }
}

export const estadisticaService = new EstadisticaService()
