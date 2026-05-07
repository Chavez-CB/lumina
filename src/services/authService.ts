/**
 * Auth Service — Wrapper métodos de autenticación
 *
 * Abstrae ambos métodos de login (credenciales y facial)
 * en una interfaz unificada para que App.tsx los consuma.
 *
 * HOY: credenciales comparan contra env vars (igual que antes)
 * FUTURO: credenciales también harán POST al backend
 *
 * Uso:
 *   import { authService } from "@/services/authService"
 *   const result = await authService.loginWithCredentials(u, p)
 *   const result = await authService.loginWithFacial(facialResponse)
 */

import type { FacialAuthResponse } from "@/types/facial"
import type { AuthUser, LoginResponse } from "@/types/auth"

const ADMIN_USER = import.meta.env.PUBLIC_LUMINA_ADMIN_USER || "admin"
const ADMIN_PASS = import.meta.env.PUBLIC_LUMINA_ADMIN_PASS || "admin123"

class AuthService {
  /**
   * LOGIN CON CREDENCIALES
   *
   * Valida usuario y contraseña.
   * HOY: compara env vars
   * FUTURO: POST /auth/login
   *
   * @param username - nombre de usuario
   * @param password - contraseña en texto plano
   * @returns LoginResponse con user+token si éxito
   */
  async loginWithCredentials(username: string, password: string): Promise<LoginResponse> {
    // Simular latencia (consistente con otras operaciones)
    await new Promise(resolve => setTimeout(resolve, 400))

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const user: AuthUser = { id: "admin_001", username, nombre: "Administrador" }
      return {
        success: true,
        user,
        token: `cred_token_${Date.now()}`,
        method: "credentials",
      }
    }

    return {
      success: false,
      error: "Credenciales incorrectas",
      method: "credentials",
    }
  }

  /**
   * LOGIN CON FACIAL
   *
   * Recibe respuesta ya procesada de facialService.authenticate()
   * Transforma FacialAuthResponse → LoginResponse
   *
   * @param facialResponse - respuesta del facialService
   * @returns LoginResponse normalizado
   */
  async loginWithFacial(facialResponse: FacialAuthResponse): Promise<LoginResponse> {
    if (!facialResponse.success || !facialResponse.user) {
      return {
        success: false,
        error: facialResponse.error || "Reconocimiento facial fallido",
        method: "facial",
      }
    }

    const user: AuthUser = {
      id: facialResponse.user.id,
      username: facialResponse.user.username,
      nombre: facialResponse.user.nombre,
    }

    return {
      success: true,
      user,
      token: facialResponse.token,
      method: "facial",
    }
  }
}

/**
 * Singleton exportado
 *
 * Importar con:
 *   import { authService } from "@/services/authService"
 */
export const authService = new AuthService()
