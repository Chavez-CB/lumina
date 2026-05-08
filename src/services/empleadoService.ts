/**
 * Empleado Service — CRUD de empleados
 *
 * Conectado al backend real: GET/POST/PUT/PATCH /api/empleados
 *
 * Mapeo de campos:
 *   Backend: nombres + apellidos (separados), foto_url, codigo
 *   Frontend: nombre (unificado), foto
 */

import { httpClient } from "@/lib/api/client"

// ── Tipo Backend (respuesta cruda del servidor) ────────────────────────────

export interface EmpleadoBackend {
  id: number
  nombres: string
  apellidos: string
  dni: string
  email?: string
  telefono?: string
  codigo?: string
  foto_url?: string
  activo: boolean
  // Campos de asignación (pueden venir en el detalle)
  cargo?: string
  area?: string
  sueldo_base?: number
  fecha_ingreso?: string
  horario_id?: string
  horario_entrada?: string
  horario_salida?: string
}

// ── Tipo Frontend (usado en toda la UI) ───────────────────────────────────

export interface Empleado {
  id: string
  nombre: string
  dni: string
  cargo: string
  area: string
  sueldoBase: number
  fechaIngreso: string
  foto: string
  activo: boolean
  horarioEntrada: string
  horarioSalida: string
  horarioId: string
  email?: string
  telefono?: string
  codigo?: string
}

// ── Adaptadores ───────────────────────────────────────────────────────────

function backendToFrontend(b: EmpleadoBackend): Empleado {
  return {
    id: String(b.id),
    nombre: `${b.nombres} ${b.apellidos}`.trim(),
    dni: b.dni,
    cargo: b.cargo ?? "",
    area: b.area ?? "",
    sueldoBase: b.sueldo_base ?? 0,
    fechaIngreso: b.fecha_ingreso ?? "",
    foto: b.foto_url ?? `https://i.pravatar.cc/150?u=${b.dni}`,
    activo: b.activo,
    horarioEntrada: b.horario_entrada ?? "08:00",
    horarioSalida: b.horario_salida ?? "17:00",
    horarioId: b.horario_id ?? "",
    email: b.email,
    telefono: b.telefono,
    codigo: b.codigo,
  }
}

function frontendToBackend(data: Omit<Empleado, "id">): Partial<EmpleadoBackend> {
  const partes = data.nombre.trim().split(" ")
  const apellidos = partes.slice(1).join(" ")
  const nombres = partes[0] ?? ""

  return {
    nombres,
    apellidos,
    dni: data.dni,
    email: data.email,
    telefono: data.telefono,
    codigo: data.codigo,
    foto_url: data.foto?.startsWith("http") ? data.foto : undefined,
    activo: data.activo,
  }
}

// ── Servicio ──────────────────────────────────────────────────────────────

class EmpleadoService {
  async getAll(params: { buscar?: string; activo?: boolean; pagina?: number; limite?: number } = {}): Promise<Empleado[]> {
    const query = new URLSearchParams()
    query.set("limite", String(params.limite ?? 200))
    if (params.pagina) query.set("pagina", String(params.pagina))
    if (params.buscar) query.set("buscar", params.buscar)
    // El controller hace activo === 'true' → enviamos 'true'/'false'
    if (params.activo !== undefined) query.set("activo", params.activo ? "true" : "false")

    const lista = await httpClient.get<EmpleadoBackend[]>(`/empleados?${query}`)
    return Array.isArray(lista) ? lista.map(backendToFrontend) : []
  }

  async getById(id: string): Promise<Empleado | undefined> {
    try {
      const emp = await httpClient.get<EmpleadoBackend>(`/empleados/${id}`)
      return backendToFrontend(emp)
    } catch {
      return undefined
    }
  }

  async create(data: Omit<Empleado, "id">): Promise<Empleado> {
    const payload = frontendToBackend(data)
    const creado = await httpClient.post<EmpleadoBackend>("/empleados", payload)
    return backendToFrontend(creado)
  }

  async update(id: string, data: Partial<Omit<Empleado, "id">>): Promise<Empleado> {
    // Solo enviamos los campos presentes (PATCH-style con PUT)
    const payload: Partial<EmpleadoBackend> = {}
    if (data.nombre !== undefined) {
      const partes = data.nombre.trim().split(" ")
      payload.nombres = partes[0]
      payload.apellidos = partes.slice(1).join(" ")
    }
    if (data.email !== undefined) payload.email = data.email
    if (data.telefono !== undefined) payload.telefono = data.telefono
    if (data.foto !== undefined && data.foto.startsWith("http")) payload.foto_url = data.foto
    if (data.activo !== undefined) payload.activo = data.activo

    const actualizado = await httpClient.put<EmpleadoBackend>(`/empleados/${id}`, payload)
    return backendToFrontend(actualizado)
  }

  async toggleActivo(id: string, activo: boolean): Promise<void> {
    if (activo) {
      await httpClient.patch(`/empleados/${id}/reactivar`)
    } else {
      await httpClient.patch(`/empleados/${id}/baja`)
    }
  }
}

export const empleadoService = new EmpleadoService()
