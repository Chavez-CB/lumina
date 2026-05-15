/**
 * Facial Authentication Service
 *
 * Intermediario entre componentes (UI) y backend (API).
 * POST /auth/facial — envía frame base64, recibe user+token o error.
 */

import type { FacialRecognitionPayload, FacialAuthResponse, FrameQualityResult } from "@/types/facial"
import { httpClient } from "@/lib/api/client"
import { frameCaptureService } from "@/lib/facial/frameCapture"

export interface IFacialAuthService {
  authenticate(payload: FacialRecognitionPayload): Promise<FacialAuthResponse>
  validateFrameQuality(frameData: ImageData): FrameQualityResult
}

export class FacialAuthService implements IFacialAuthService {
  /**
   * Autenticar usando reconocimiento facial.
   * Envía el frame al backend y recibe el usuario autenticado.
   */
  async authenticate(payload: FacialRecognitionPayload): Promise<FacialAuthResponse> {
    try {
      return await httpClient.post<FacialAuthResponse>(
        "/auth/facial",
        payload,
        { timeout: 15000 }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      return {
        success: false,
        error: `Autenticación facial fallida: ${message}`,
      }
    }
  }

  /**
   * Valida la calidad del frame antes de enviarlo al backend.
   * Evita envíos con imágenes oscuras o borrosas.
   */
  validateFrameQuality(frameData: ImageData): FrameQualityResult {
    const quality = frameCaptureService.analyzeQuality(frameData)
    return {
      isValid: quality.isValid,
      confidence: quality.confidence,
      reason: quality.reason,
    }
  }
}

export const facialAuthService = new FacialAuthService()
