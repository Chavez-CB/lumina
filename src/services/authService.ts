/**
 * Auth Service — Login para administradores
 *
 * El backend NO tiene endpoint POST /auth/login todavía.
 * Estrategia actual: buscar admin por email en GET /api/admin y validar con env vars.
 *
 * Schema real del admin (PostgreSQL):
 *   id            SERIAL
 *   nombre        VARCHAR(100)
 *   apellido      VARCHAR(100)
 *   email         VARCHAR(150) UNIQUE   ← campo de búsqueda/login
 *   password_hash VARCHAR(255)
 *   activo        BOOLEAN
 *
 * Cuando el backend implemente POST /api/admin/login, reemplazar loginWithCredentials
 * por: return await httpClient.post('/admin/login', { email, password })
 */

import type { AuthUser, LoginResponse } from "@/types/auth"
import { httpClient } from "@/lib/api/client"

interface AdminBackend {
  id: number
  nombre: string
  apellido: string
  email: string
  activo: boolean
}

type AdminListResponse =
  | { ok: boolean; data: AdminBackend[]; meta?: unknown }
  | AdminBackend[]

function unwrapAdmins(res: AdminListResponse): AdminBackend[] {
  if (Array.isArray(res)) return res
  const wrapped = res as { data?: AdminBackend[] }
  return Array.isArray(wrapped.data) ? wrapped.data : []
}

class AuthService {
  /**
   * LOGIN CON CREDENCIALES
   *
   * El backend reconoce al admin por email.
   * Username se trata como email o nombre para buscar coincidencia.
   */
  async loginWithCredentials(username: string, password: string): Promise<LoginResponse> {
    // Fallback para desarrollo (env vars)
    const ADMIN_USER = import.meta.env.PUBLIC_LUMINA_ADMIN_USER || "admin"
    const ADMIN_PASS = import.meta.env.PUBLIC_LUMINA_ADMIN_PASS || "admin123"

    try {
      // Buscar admin por nombre/email en el backend
      const raw = await httpClient.get<AdminListResponse>(
        `/admin?buscar=${encodeURIComponent(username)}&activo=1`
      )
      const admins = unwrapAdmins(raw)

      // Buscar coincidencia por email o nombre completo
      const admin = admins.find(a =>
        a.email?.toLowerCase() === username.toLowerCase() ||
        `${a.nombre} ${a.apellido}`.toLowerCase() === username.toLowerCase() ||
        a.nombre?.toLowerCase() === username.toLowerCase()
      )

      if (admin) {
        // El backend encontró el admin — credenciales aceptadas
        // (validación de contraseña real pendiente de POST /admin/login)
        const user: AuthUser = {
          id: String(admin.id),
          username: admin.email,
          nombre: `${admin.nombre} ${admin.apellido}`.trim(),
        }
        return {
          success: true,
          user,
          token: `admin_token_${Date.now()}`,
          method: "credentials",
        }
      }

      // Si el backend no tiene el admin → fallback a env vars
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        const user: AuthUser = { id: "admin_001", username, nombre: "Administrador" }
        return { success: true, user, token: `cred_token_${Date.now()}`, method: "credentials" }
      }

      return { success: false, error: "Credenciales incorrectas", method: "credentials" }
    } catch {
      // Si el backend falla → caer en env vars
      await new Promise(resolve => setTimeout(resolve, 300))
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        const user: AuthUser = { id: "admin_001", username, nombre: "Administrador" }
        return { success: true, user, token: `cred_token_${Date.now()}`, method: "credentials" }
      }
      return { success: false, error: "Credenciales incorrectas", method: "credentials" }
    }
  }
}

export const authService = new AuthService()
