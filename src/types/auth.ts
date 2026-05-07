/**
 * Types para Autenticación Global
 * 
 * Define estructura del Context y métodos de autenticación
 */

import type { FacialAuthResponse } from "./facial"

// ============ USUARIO AUTENTICADO ============

/**
 * Datos del usuario autenticado
 * Se guarda en AuthContext
 */
export interface AuthUser {
  id?: string
  username: string
  nombre?: string
}

// ============ CONTEXTO DE AUTENTICACIÓN ============

/**
 * AuthContext - disponible en toda la app via useAuth()
 * 
 * Estados:
 * - isAuthenticated: usuario loggeado
 * - user: datos del usuario
 * - isLoading: procesando login
 * - error: qué salió mal
 * 
 * Métodos:
 * - loginWithCredentials: username + password
 * - loginWithFacial: frame facial reconocido
 * - logout: cerrar sesión
 */
export interface AuthContextType {
  isAuthenticated: boolean               // ¿Usuario loggeado?
  user: AuthUser | null                  // Datos si loggeado
  isLoading: boolean                     // ¿Procesando?
  error: string | null                   // ¿Error en login?

  // Métodos autenticación
  loginWithCredentials: (username: string, password: string) => Promise<boolean>
  loginWithFacial: (facialResponse: FacialAuthResponse) => Promise<boolean>
  logout: () => void                     // Cerrar sesión
}

// ============ RESPUESTA UNIFICADA LOGIN ============

/**
 * Respuesta genérica para cualquier método de login
 * Tanto credenciales como facial retornan estructura similar
 */
export interface LoginResponse {
  success: boolean                       // ¿Login exitoso?
  user?: AuthUser                        // Datos si éxito
  token?: string                         // JWT o sesión
  error?: string                         // Mensaje si falla
  method: "credentials" | "facial"       // Cómo se loggeó
}
