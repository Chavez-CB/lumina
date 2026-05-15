/**
 * Area Service — CRUD de áreas/aulas
 *
 * Backend: GET/POST/PUT/DELETE /api/areas
 *
 * Schema real (PostgreSQL):
 *   id          SERIAL PK
 *   codigo      VARCHAR(20) UNIQUE
 *   nombre      VARCHAR(100)
 *   tipo        tipo_area  → 'aula'|'laboratorio'|'auditorio'|'sala'|'otro'
 *   capacidad   SMALLINT
 *   piso        SMALLINT
 *   descripcion TEXT
 *   activo      BOOLEAN
 */

import { httpClient } from "@/lib/api/client"

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface Area {
  id: string
  codigo: string
  nombre: string
  tipo: "aula" | "laboratorio" | "auditorio" | "sala" | "otro"
  capacidad?: number
  piso?: number
  descripcion?: string
  activo: boolean
}

interface AreaBackend {
  id: number
  codigo: string
  nombre: string
  tipo: string
  capacidad: number | null
  piso: number | null
  descripcion: string | null
  activo: boolean
  created_at?: string
}

// ── Adaptadores ────────────────────────────────────────────────────────────

function backendToFrontend(b: AreaBackend): Area {
  return {
    id: String(b.id),
    codigo: b.codigo,
    nombre: b.nombre,
    tipo: (b.tipo as Area["tipo"]) ?? "aula",
    capacidad: b.capacidad ?? undefined,
    piso: b.piso ?? undefined,
    descripcion: b.descripcion ?? undefined,
    activo: b.activo,
  }
}

type AreasResponse = { ok: boolean; data: AreaBackend[] } | AreaBackend[]
type AreaResponse  = { ok: boolean; data: AreaBackend  } | AreaBackend

function unwrapList(res: AreasResponse): AreaBackend[] {
  if (Array.isArray(res)) return res
  const wrapped = res as { data?: AreaBackend[] }
  return Array.isArray(wrapped.data) ? wrapped.data : []
}

function unwrapOne(res: AreaResponse): AreaBackend {
  return (res as { data: AreaBackend }).data ?? (res as AreaBackend)
}

// ── Servicio ───────────────────────────────────────────────────────────────

class AreaService {
  async getAll(soloActivas = false): Promise<Area[]> {
    const query = soloActivas ? "?activo=true" : ""
    const res = await httpClient.get<AreasResponse>(`/areas${query}`)
    return unwrapList(res).map(backendToFrontend)
  }

  async getById(id: string): Promise<Area | undefined> {
    try {
      const res = await httpClient.get<AreaResponse>(`/areas/${id}`)
      return backendToFrontend(unwrapOne(res))
    } catch {
      return undefined
    }
  }

  async create(data: Omit<Area, "id">): Promise<Area> {
    const res = await httpClient.post<AreaResponse>("/areas", {
      codigo: data.codigo,
      nombre: data.nombre,
      tipo: data.tipo ?? "aula",
      capacidad: data.capacidad ?? null,
      piso: data.piso ?? null,
      descripcion: data.descripcion ?? null,
    })
    return backendToFrontend(unwrapOne(res))
  }

  async update(id: string, data: Partial<Omit<Area, "id">>): Promise<Area> {
    const payload: Record<string, unknown> = {}
    if (data.codigo !== undefined)      payload.codigo      = data.codigo
    if (data.nombre !== undefined)      payload.nombre      = data.nombre
    if (data.tipo !== undefined)        payload.tipo        = data.tipo
    if (data.capacidad !== undefined)   payload.capacidad   = data.capacidad
    if (data.piso !== undefined)        payload.piso        = data.piso
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion
    if (data.activo !== undefined)      payload.activo      = data.activo

    const res = await httpClient.put<AreaResponse>(`/areas/${id}`, payload)
    return backendToFrontend(unwrapOne(res))
  }

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/areas/${id}`)
  }
}

export const areaService = new AreaService()
