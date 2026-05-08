/**
 * Horario Service — CRUD de horarios laborales
 *
 * Conectado al backend real: GET/POST/PUT/DELETE /api/horarios
 */

import { httpClient } from "@/lib/api/client"

export interface Horario {
  id: string
  nombre: string
  entrada: string
  salida: string
  toleranciaMinutos: number
  diasLaborables: number[] // 0=Dom, 1=Lun ... 6=Sab
  area?: string
}

// ── Tipo crudo del backend ─────────────────────────────────────────────────

interface HorarioBackend {
  id: number
  nombre: string
  hora_entrada: string
  hora_salida: string
  tolerancia_minutos: number
  dias_laborables: number[]
  area?: string
}

// ── Adaptadores ────────────────────────────────────────────────────────────

function backendToFrontend(b: HorarioBackend): Horario {
  return {
    id: String(b.id),
    nombre: b.nombre,
    entrada: b.hora_entrada,
    salida: b.hora_salida,
    toleranciaMinutos: b.tolerancia_minutos ?? 10,
    diasLaborables: Array.isArray(b.dias_laborables) ? b.dias_laborables : [1, 2, 3, 4, 5],
    area: b.area,
  }
}

function frontendToBackend(data: Omit<Horario, "id">): Partial<HorarioBackend> {
  return {
    nombre: data.nombre,
    hora_entrada: data.entrada,
    hora_salida: data.salida,
    tolerancia_minutos: data.toleranciaMinutos,
    dias_laborables: data.diasLaborables,
    area: data.area,
  }
}

// ── Servicio ───────────────────────────────────────────────────────────────

class HorarioService {
  async getAll(): Promise<Horario[]> {
    const lista = await httpClient.get<HorarioBackend[]>("/horarios")
    return Array.isArray(lista) ? lista.map(backendToFrontend) : []
  }

  async getById(id: string): Promise<Horario | undefined> {
    try {
      const h = await httpClient.get<HorarioBackend>(`/horarios/${id}`)
      return backendToFrontend(h)
    } catch {
      return undefined
    }
  }

  async create(data: Omit<Horario, "id">): Promise<Horario> {
    const creado = await httpClient.post<HorarioBackend>("/horarios", frontendToBackend(data))
    return backendToFrontend(creado)
  }

  async update(id: string, data: Partial<Omit<Horario, "id">>): Promise<Horario> {
    const payload: Partial<HorarioBackend> = {}
    if (data.nombre !== undefined) payload.nombre = data.nombre
    if (data.entrada !== undefined) payload.hora_entrada = data.entrada
    if (data.salida !== undefined) payload.hora_salida = data.salida
    if (data.toleranciaMinutos !== undefined) payload.tolerancia_minutos = data.toleranciaMinutos
    if (data.diasLaborables !== undefined) payload.dias_laborables = data.diasLaborables

    const actualizado = await httpClient.put<HorarioBackend>(`/horarios/${id}`, payload)
    return backendToFrontend(actualizado)
  }

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/horarios/${id}`)
  }

  async assignToEmpleado(_empleadoId: string, _horarioId: string): Promise<void> {
    // Se gestiona mediante /api/asignaciones — pendiente de implementar
    console.warn("[HorarioService] assignToEmpleado: usa /api/asignaciones para asignar horarios a empleados")
  }
}

export const horarioService = new HorarioService()
