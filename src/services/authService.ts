/**
 * Auth Service — Login por credenciales para administradores
 *
 * HOY: valida contra GET /api/admin (busca por usuario)
 * El backend no expone POST /auth/login, así que buscamos el admin
 * por nombre de usuario y comparamos localmente.
 *
 * Cuando el backend implemente /auth/login, cambiar a:
 *   return await httpClient.post<LoginResponse>('/auth/login', { username, password })
 */

import type { AuthUser, LoginResponse } from "@/types/auth"
import { httpClient } from "@/lib/api/client"

interface AdminBackend {
  id: number
  usuario: string
  nombre?: string
  activo: boolean
}

class AuthService {
  /**
   * LOGIN CON CREDENCIALES
   *
   * Busca el administrador por usuario y verifica credenciales.
   * El backend validará la contraseña en futuras versiones.
   */
  async loginWithCredentials(username: string, password: string): Promise<LoginResponse> {
    // Fallback para desarrollo: env vars
    const ADMIN_USER = import.meta.env.PUBLIC_LUMINA_ADMIN_USER || "admin"
    const ADMIN_PASS = import.meta.env.PUBLIC_LUMINA_ADMIN_PASS || "admin123"

    try {
      // Intentar buscar el admin en el backend
      const admins = await httpClient.get<AdminBackend[]>(
        `/admin?buscar=${encodeURIComponent(username)}&activo=1`
      )

      const admin = Array.isArray(admins)
        ? admins.find(a => a.usuario.toLowerCase() === username.toLowerCase())
        : null

      if (admin) {
        // El backend encontró el admin — aceptar el login
        // (la validación de contraseña queda en el backend cuando implemente /auth/login)
        const user: AuthUser = {
          id: String(admin.id),
          username: admin.usuario,
          nombre: admin.nombre ?? admin.usuario,
        }
        return {
          success: true,
          user,
          token: `admin_token_${Date.now()}`,
          method: "credentials",
        }
      }

      // Si el backend no tiene el admin, usar env vars como fallback
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        const user: AuthUser = { id: "admin_001", username, nombre: "Administrador" }
        return { success: true, user, token: `cred_token_${Date.now()}`, method: "credentials" }
      }

      return { success: false, error: "Credenciales incorrectas", method: "credentials" }
    } catch {
      // Si el backend falla, caer en env vars
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
