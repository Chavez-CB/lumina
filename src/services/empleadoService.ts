/**
 * Empleado Service — CRUD de empleados
 *
 * HOY: estado en memoria inicializado desde mockData
 * FUTURO: GET/POST/PUT /empleados
 */

import type { Empleado } from "@/lib/mockData"
import { empleados as mockEmpleados } from "@/lib/mockData"
// import { httpClient } from "@/lib/api/client"

class EmpleadoService {
  private _empleados: Empleado[] = [...mockEmpleados]

  getAll(): Empleado[] {
    return this._empleados
    // FUTURO: return await httpClient.get<Empleado[]>("/empleados")
  }

  getById(id: string): Empleado | undefined {
    return this._empleados.find(e => e.id === id)
  }

  async create(data: Omit<Empleado, "id">): Promise<Empleado> {
    // ====== HOY ======
    const nuevo: Empleado = { ...data, id: `e${Date.now()}` }
    this._empleados = [...this._empleados, nuevo]
    return nuevo
    // FUTURO: return await httpClient.post<Empleado>("/empleados", data)
  }

  async update(id: string, data: Partial<Omit<Empleado, "id">>): Promise<Empleado> {
    // ====== HOY ======
    this._empleados = this._empleados.map(e => e.id === id ? { ...e, ...data } : e)
    return this._empleados.find(e => e.id === id)!
    // FUTURO: return await httpClient.put<Empleado>(`/empleados/${id}`, data)
  }

  async toggleActivo(id: string): Promise<void> {
    const emp = this._empleados.find(e => e.id === id)
    if (emp) await this.update(id, { activo: !emp.activo })
    // FUTURO: await httpClient.put(`/empleados/${id}/toggle`, {})
  }
}

export const empleadoService = new EmpleadoService()
