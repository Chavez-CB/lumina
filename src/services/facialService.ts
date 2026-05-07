/**
 * Facial Authentication Service
 * 
 * Intermediario entre componentes (UI) y backend (API)
 * 
 * HOY: Retorna mock (90% éxito)
 * FUTURO: POST /auth/facial al backend real
 * 
 * Cambio único cuando backend esté listo:
 *   1. Descomentar: return await httpClient.post(...)
 *   2. Comentar: return this.mockFacialAuth(...)
 *   3. Listo. Todo lo demás funciona igual.
 * 
 * Uso:
 *   import { facialAuthService } from "@/services/facialService"
 *   const response = await facialAuthService.authenticate(payload)
 *   const quality = facialAuthService.validateFrameQuality(imageData)
 */

import type { FacialRecognitionPayload, FacialAuthResponse, FrameQualityResult } from "@/types/facial"
import { httpClient } from "@/lib/api/client"
import { frameCaptureService } from "@/lib/facial/frameCapture"

/**
 * Interface — Contrato del servicio
 * 
 * Cualquier implementación debe cumplir esto
 * Permite tener múltiples implementaciones (mock, real, test)
 */
export interface IFacialAuthService {
  /**
   * Autenticar usando frame facial
   * 
   * @param payload - frame base64 + metadata
   * @returns respuesta con user/token o error
   */
  authenticate(payload: FacialRecognitionPayload): Promise<FacialAuthResponse>

  /**
   * Validar calidad del frame antes de enviar
   * 
   * @param frameData - pixels crudos del canvas
   * @returns validación + confianza
   */
  validateFrameQuality(frameData: ImageData): FrameQualityResult
}

/**
 * Implementación del servicio
 */
export class FacialAuthService implements IFacialAuthService {
  /**
   * AUTHENTICATE — Principal
   * 
   * HOY: Simula autenticación (90% éxito)
   * FUTURO: Envía al backend real
   */
  async authenticate(payload: FacialRecognitionPayload): Promise<FacialAuthResponse> {
    try {
      // ============ HOY (SIN BACKEND) ============
      // Simula respuesta con probabilidad
      return await this.mockFacialAuth(payload)

      // ============ FUTURO (CON BACKEND) ============
      // Descomentar cuando backend esté listo:
      // return await httpClient.post<FacialAuthResponse>(
      //   '/auth/facial',
      //   payload,
      //   { timeout: 15000 }  // timeout más largo para procesamiento ML
      // )
    } catch (error) {
      // Capturar cualquier error (network, timeout, server)
      const message = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        error: `Authentication failed: ${message}`,
      }
    }
  }

  /**
   * VALIDATEFRAMEQUALITY — Verificar si frame es usable
   * 
   * Reutiliza lógica de frameCapture.ts
   * Valida luminancia, contraste, claridad
   */
  validateFrameQuality(frameData: ImageData): FrameQualityResult {
    // Delegar a frameCapture (ya tiene análisis completo)
    const quality = frameCaptureService.analyzeQuality(frameData)

    return {
      isValid: quality.isValid,
      confidence: quality.confidence,
      reason: quality.reason,
    }
  }

  /**
   * ============ MOCK IMPLEMENTATION (HOY) ============
   * 
   * Simula respuesta del backend
   * - 90% de probabilidad: éxito (retorna user + token)
   * - 10% de probabilidad: fallo (rostro no reconocido)
   * 
   * Útil para:
   * - Testear flujos sin backend
   * - Demostración y prototipado
   * - Desarrollo frontend en paralelo con backend
   * 
   * @param payload - datos capturados
   * @returns Promise<FacialAuthResponse>
   */
  private mockFacialAuth(payload: FacialRecognitionPayload): Promise<FacialAuthResponse> {
    // Simular latencia de red (200-500ms)
    // Así parece más realista
    const delay = Math.random() * 300 + 200

    return new Promise(resolve => {
      setTimeout(() => {
        // 90% éxito, 10% fallo
        const recognitionProb = Math.random()
        const success = recognitionProb > 0.1

        if (success) {
          // Retornar usuario simulado
          // En producción, backend buscaría en DB facial
          resolve({
            success: true,
            user: {
              id: "facial_user_001",
              username: "edward.montero",
              nombre: "Edward Montero",
            },
            // Token único cada vez
            token: `mock_jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          })
        } else {
          // Fallo: rostro no reconocido
          resolve({
            success: false,
            error: "Facial recognition failed - no match found in database",
          })
        }
      }, delay)
    })
  }
}

/**
 * Singleton exportado
 * 
 * Importar con:
 *   import { facialAuthService } from "@/services/facialService"
 *   const response = await facialAuthService.authenticate(payload)
 */
export const facialAuthService = new FacialAuthService()
