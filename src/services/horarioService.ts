/**
 * Horario Service — CRUD de horarios laborales
 *
 * Backend: GET/POST/PUT/DELETE /api/horarios
 *
 * Schema real (PostgreSQL):
 *   id              SERIAL PK
 *   nombre          VARCHAR(100)
 *   area_id         INT NOT NULL → FK areas(id)
 *   responsable_id  INT           → FK personas(id)
 *   dia_semana      TEXT[]        ← array de strings: 'lun','mar','mie','jue','vie','sab','dom'
 *   hora_inicio     TIME          ← "HH:MM:SS"
 *   hora_fin        TIME          ← "HH:MM:SS"
 *   tolerancia_min  SMALLINT      ← minutos
 *   fecha_desde     DATE
 *   fecha_hasta     DATE
 *   activo          BOOLEAN
 */

import { httpClient } from "@/lib/api/client"

// ── Días ──────────────────────────────────────────────────────────────────
// Mapeo índice (0=Dom) ↔ código del backend
const DIA_INDEX_TO_CODE = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const
const DIA_CODE_TO_INDEX: Record<string, number> = {
  dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6,
}

// ── Tipos frontend ────────────────────────────────────────────────────────

export interface Horario {
  id: string
  nombre: string
  entrada: string          // "HH:MM"
  salida: string           // "HH:MM"
  toleranciaMinutos: number
  diasLaborables: number[] // 0=Dom, 1=Lun … 6=Sab
  areaId?: string
  area?: string
  responsableId?: string
  activo?: boolean
  fechaDesde?: string
  fechaHasta?: string
}

// ── Tipo crudo del backend ─────────────────────────────────────────────────

interface HorarioBackend {
  id: number
  nombre: string
  area_id: number | null
  responsable_id: number | null
  dia_semana: string[]      // ['lun','mar','mie','jue','vie']
  hora_inicio: string       // "08:00:00"
  hora_fin: string          // "17:00:00"
  tolerancia_min: number
  fecha_desde: string | null
  fecha_hasta: string | null
  activo: boolean
  // Campo JOIN opcional (si el backend hace JOIN con areas)
  area_nombre?: string
}

// ── Adaptadores ────────────────────────────────────────────────────────────

function backendToFrontend(b: HorarioBackend): Horario {
  // Normalizar hora: "08:00:00" → "08:00"
  const normalizeTime = (t: string | null) => (t ? t.slice(0, 5) : "")

  return {
    id: String(b.id),
    nombre: b.nombre,
    entrada: normalizeTime(b.hora_inicio),
    salida: normalizeTime(b.hora_fin),
    toleranciaMinutos: b.tolerancia_min ?? 10,
    diasLaborables: Array.isArray(b.dia_semana)
      ? b.dia_semana.map(c => DIA_CODE_TO_INDEX[c] ?? -1).filter(i => i >= 0)
      : [1, 2, 3, 4, 5],
    areaId: b.area_id != null ? String(b.area_id) : undefined,
    area: b.area_nombre,
    responsableId: b.responsable_id != null ? String(b.responsable_id) : undefined,
    activo: b.activo,
    fechaDesde: b.fecha_desde ?? undefined,
    fechaHasta: b.fecha_hasta ?? undefined,
  }
}

function frontendToBackend(data: Omit<Horario, "id">): Record<string, unknown> {
  return {
    nombre: data.nombre,
    area_id: data.areaId ? parseInt(data.areaId) : null,
    responsable_id: data.responsableId ? parseInt(data.responsableId) : null,
    // Backend espera TEXT[]: convertimos índices numéricos → códigos de día
    dia_semana: (data.diasLaborables ?? [1, 2, 3, 4, 5]).map(i => DIA_INDEX_TO_CODE[i] ?? 'lun'),
    hora_inicio: data.entrada,   // "HH:MM" — PostgreSQL acepta HH:MM sin segundos
    hora_fin: data.salida,
    tolerancia_min: data.toleranciaMinutos ?? 10,
    fecha_desde: data.fechaDesde ?? null,
    fecha_hasta: data.fechaHasta ?? null,
  }
}

// ── Tipos de respuesta del backend ─────────────────────────────────────────

type HorarioResponse = { ok: boolean; data: HorarioBackend } | HorarioBackend
type HorariosResponse = { ok: boolean; data: HorarioBackend[] } | HorarioBackend[]

function unwrapOne(res: HorarioResponse): HorarioBackend {
  return (res as { data: HorarioBackend }).data ?? (res as HorarioBackend)
}

function unwrapList(res: HorariosResponse): HorarioBackend[] {
  const list = (res as { data: HorarioBackend[] }).data ?? (res as HorarioBackend[])
  return Array.isArray(list) ? list : []
}

// ── Servicio ───────────────────────────────────────────────────────────────

class HorarioService {
  async getAll(): Promise<Horario[]> {
    const res = await httpClient.get<HorariosResponse>("/horarios")
    return unwrapList(res).map(backendToFrontend)
  }

  async getById(id: string): Promise<Horario | undefined> {
    try {
      const res = await httpClient.get<HorarioResponse>(`/horarios/${id}`)
      return backendToFrontend(unwrapOne(res))
    } catch {
      return undefined
    }
  }

  async create(data: Omit<Horario, "id">): Promise<Horario> {
    const payload = frontendToBackend(data)
    const res = await httpClient.post<HorarioResponse>("/horarios", payload)
    return backendToFrontend(unwrapOne(res))
  }

  async update(id: string, data: Partial<Omit<Horario, "id">>): Promise<Horario> {
    const payload: Record<string, unknown> = {}
    if (data.nombre !== undefined) payload.nombre = data.nombre
    if (data.areaId !== undefined) payload.area_id = data.areaId ? parseInt(data.areaId) : null
    if (data.responsableId !== undefined) payload.responsable_id = data.responsableId ? parseInt(data.responsableId) : null
    if (data.entrada !== undefined) payload.hora_inicio = data.entrada
    if (data.salida !== undefined) payload.hora_fin = data.salida
    if (data.toleranciaMinutos !== undefined) payload.tolerancia_min = data.toleranciaMinutos
    if (data.diasLaborables !== undefined)
      payload.dia_semana = data.diasLaborables.map(i => DIA_INDEX_TO_CODE[i] ?? 'lun')
    if (data.activo !== undefined) payload.activo = data.activo
    if (data.fechaDesde !== undefined) payload.fecha_desde = data.fechaDesde
    if (data.fechaHasta !== undefined) payload.fecha_hasta = data.fechaHasta

    const res = await httpClient.put<HorarioResponse>(`/horarios/${id}`, payload)
    return backendToFrontend(unwrapOne(res))
  }

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/horarios/${id}`)
  }
}

export const horarioService = new HorarioService()
