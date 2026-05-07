/**
 * Horario Service — CRUD de horarios laborales
 *
 * HOY: estado en memoria inicializado desde mockData
 * FUTURO: GET/POST/PUT/DELETE /horarios
 */

import type { Horario } from "@/lib/mockData"
import { horarios as mockHorarios } from "@/lib/mockData"
// import { httpClient } from "@/lib/api/client"

class HorarioService {
  private _horarios: Horario[] = [...mockHorarios]

  getAll(): Horario[] {
    return this._horarios
    // FUTURO: return await httpClient.get<Horario[]>("/horarios")
  }

  getById(id: string): Horario | undefined {
    return this._horarios.find(h => h.id === id)
  }

  async create(data: Omit<Horario, "id">): Promise<Horario> {
    // ====== HOY ======
    const nuevo: Horario = { ...data, id: `h${Date.now()}` }
    this._horarios = [...this._horarios, nuevo]
    return nuevo
    // FUTURO: return await httpClient.post<Horario>("/horarios", data)
  }

  async update(id: string, data: Partial<Omit<Horario, "id">>): Promise<Horario> {
    // ====== HOY ======
    this._horarios = this._horarios.map(h => h.id === id ? { ...h, ...data } : h)
    return this._horarios.find(h => h.id === id)!
    // FUTURO: return await httpClient.put<Horario>(`/horarios/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    // ====== HOY ======
    this._horarios = this._horarios.filter(h => h.id !== id)
    // FUTURO: await httpClient.delete(`/horarios/${id}`)
  }

  async assignToEmpleado(empleadoId: string, horarioId: string): Promise<void> {
    // FUTURO: await httpClient.put(`/empleados/${empleadoId}/horario`, { horarioId })
    console.log(`Asignando horario ${horarioId} a empleado ${empleadoId}`)
  }
}

export const horarioService = new HorarioService()
