/**
 * Impuesto Service — CRUD de impuestos y deducciones
 *
 * HOY: estado en memoria inicializado desde mockData
 * FUTURO: GET/POST/PUT /impuestos
 */

import type { Impuesto } from "@/lib/mockData"
import { impuestos as mockImp } from "@/lib/mockData"
// import { httpClient } from "@/lib/api/client"

class ImpuestoService {
  private _impuestos: Impuesto[] = [...mockImp]

  getAll(): Impuesto[] {
    return this._impuestos
    // FUTURO: return await httpClient.get<Impuesto[]>("/impuestos")
  }

  async create(data: Omit<Impuesto, "id">): Promise<Impuesto> {
    // ====== HOY ======
    const nuevo: Impuesto = { ...data, id: `t${Date.now()}` }
    this._impuestos = [...this._impuestos, nuevo]
    return nuevo

    // ====== FUTURO ======
    // const nuevo = await httpClient.post<Impuesto>("/impuestos", data)
    // this._impuestos = [...this._impuestos, nuevo]
    // return nuevo
  }

  async update(id: string, data: Partial<Omit<Impuesto, "id">>): Promise<Impuesto> {
    // ====== HOY ======
    this._impuestos = this._impuestos.map(i => i.id === id ? { ...i, ...data } : i)
    return this._impuestos.find(i => i.id === id)!

    // ====== FUTURO ======
    // const actualizado = await httpClient.put<Impuesto>(`/impuestos/${id}`, data)
    // this._impuestos = this._impuestos.map(i => i.id === id ? actualizado : i)
    // return actualizado
  }

  async toggleActivo(id: string): Promise<void> {
    const imp = this._impuestos.find(i => i.id === id)
    if (imp) await this.update(id, { activo: !imp.activo })
    // FUTURO: await httpClient.put(`/impuestos/${id}/toggle`, {})
  }

  async delete(id: string): Promise<void> {
    // ====== HOY ======
    this._impuestos = this._impuestos.filter(i => i.id !== id)
    // FUTURO: await httpClient.delete(`/impuestos/${id}`)
  }
}

export const impuestoService = new ImpuestoService()
