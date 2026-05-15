/**
 * mockData.ts — Residual de utilidades y tipos locales
 *
 * Los generadores de datos simulados han sido eliminados.
 * Solo se mantienen:
 *   - Tipo EstadoAsistencia (re-exportado para compatibilidad)
 *   - Funciones de fecha puras (sin dependencias)
 *   - Constantes de configuración por defecto (para configService)
 *   - Tipos locales usados en vistas que aún no tienen endpoint en el backend
 *
 * Las interfaces Empleado, Horario y Asistencia ahora viven en sus servicios.
 */

// Re-exportar para compatibilidad con imports existentes
export type { EstadoAsistencia } from "@/types/asistencia"

// ── Tipos locales (sin endpoint en backend todavía) ───────────────────────

export interface Impuesto {
  id: string
  nombre: string
  porcentaje: number
  aplicaTodos: boolean
  tipo: "deduccion" | "aporte"
  activo: boolean
}

export interface Reconocido {
  empleado: { id: string; nombre: string; foto: string; cargo: string; horarioEntrada: string }
  hora: string
  tipo: "entrada" | "salida"
  estadoMarca: "puntual" | "tardanza"
}

// ── Utilidades de fecha ────────────────────────────────────────────────────

export const fechaOffset = (dias: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}

export const fechaHoy = (): string => new Date().toISOString().slice(0, 10)

export function sumarMinutos(hora: string, mins: number): string {
  const [h, m] = hora.split(":").map(Number)
  const total = h * 60 + m + mins
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60).toString().padStart(2, "0")
  const mm = (((total % 60) + 60) % 60).toString().padStart(2, "0")
  return `${hh}:${mm}`
}

// ── Constantes de configuración por defecto ────────────────────────────────
// Usadas por configService para inicializar desde localStorage.

export const configDescuentos = {
  toleranciaMinutos: 10,
  montoTardanza: 15,
  porcentajeFalta: 100,
}

export const empresa = {
  nombre: "Corporacion Lumina S.A.C.",
  ruc: "20612345678",
  direccion: "Av. Javier Prado 4250, San Isidro, Lima",
  logo: "",
}

// ── Datos stub para módulos sin endpoint de backend ────────────────────────
// Impuestos: no hay endpoint /api/impuestos → datos hardcodeados temporalmente.

export const impuestos: Impuesto[] = [
  { id: "t1", nombre: "AFP",                     porcentaje: 13, aplicaTodos: true,  tipo: "deduccion", activo: true  },
  { id: "t2", nombre: "Renta 5ta categoria",     porcentaje: 8,  aplicaTodos: false, tipo: "deduccion", activo: true  },
  { id: "t3", nombre: "Seguro Social (EsSalud)", porcentaje: 9,  aplicaTodos: true,  tipo: "aporte",    activo: true  },
  { id: "t4", nombre: "ONP",                     porcentaje: 13, aplicaTodos: false, tipo: "deduccion", activo: false },
]
