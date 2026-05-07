/**
 * Auth Service — Login por credenciales para administradores
 *
 * HOY: compara contra env vars
 * FUTURO: POST /auth/login al backend
 *
 * Uso:
 *   import { authService } from "@/services/authService"
 *   const result = await authService.loginWithCredentials(u, p)
 */

import type { AuthUser, LoginResponse } from "@/types/auth"

const ADMIN_USER = import.meta.env.PUBLIC_LUMINA_ADMIN_USER || "admin"
const ADMIN_PASS = import.meta.env.PUBLIC_LUMINA_ADMIN_PASS || "admin123"

class AuthService {
  /**
   * LOGIN CON CREDENCIALES
   *
   * Solo para administradores. Los empleados usan attendanceService.
   *
   * HOY: compara env vars
   * FUTURO: POST /auth/login
   */
  async loginWithCredentials(username: string, password: string): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 400))

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const user: AuthUser = { id: "admin_001", username, nombre: "Administrador" }
      return { success: true, user, token: `cred_token_${Date.now()}`, method: "credentials" }
    }

    return { success: false, error: "Credenciales incorrectas", method: "credentials" }
  }
}

/** Singleton exportado */
export const authService = new AuthService()
