/**
 * useFacialAuth — Hook personalizado de autenticación facial
 *
 * Orquesta:
 *   1. videoCaptureService  → gestión de stream de cámara
 *   2. frameCaptureService  → extracción de fotogramas
 *   3. facialAuthService    → autenticación (mock → backend futuro)
 *
 * Retorna:
 *   - state: estado actual (loading, recognizing, error, progress)
 *   - videoRef: ref para el elemento <video>
 *   - startCamera(): iniciar cámara
 *   - stopCamera(): parar cámara
 *   - authenticate(): capturar frame y autenticar
 *   - reset(): limpiar estado de error
 *
 * Uso:
 *   const { state, videoRef, startCamera, stopCamera, authenticate } = useFacialAuth()
 *   // En JSX: <video ref={videoRef} autoPlay muted playsInline />
 */

import { useState, useRef, useCallback, useEffect } from "react"
import type { FacialAuthState, FacialRecognitionPayload } from "@/types/facial"
import type { FacialAuthResponse } from "@/types/facial"
import { videoCaptureService } from "@/lib/facial/videoCapture"
import { frameCaptureService } from "@/lib/facial/frameCapture"
import { facialAuthService } from "@/services/facialService"

// Estado inicial — cámara apagada, sin errores
const INITIAL_STATE: FacialAuthState = {
  isLoading: false,
  isRecognizing: false,
  error: null,
  lastFrame: null,
  recognitionProgress: 0,
}

export function useFacialAuth() {
  const [state, setState] = useState<FacialAuthState>(INITIAL_STATE)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Cleanup automático al desmontar componente
  useEffect(() => {
    return () => {
      videoCaptureService.stop()
      frameCaptureService.dispose()
    }
  }, [])

  /**
   * STARTCAMERA — Solicitar acceso a cámara
   *
   * Dispara popup "¿Permitir acceso a cámara?"
   * Si acepta → activa stream en <video>
   * Si rechaza → setea error en state
   */
  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      setState(s => ({ ...s, error: "Video element not ready" }))
      return
    }

    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      await videoCaptureService.start(videoRef.current, {
        width: 640,
        height: 480,
        facingMode: "user",
      })

      setState(s => ({
        ...s,
        isLoading: false,
        isRecognizing: true,
        error: null,
      }))
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al acceder a la cámara"
      setState(s => ({
        ...s,
        isLoading: false,
        isRecognizing: false,
        error: msg,
      }))
    }
  }, [])

  /**
   * STOPCAMERA — Parar cámara
   *
   * Libera acceso a hardware
   * Reinicia estado de reconocimiento
   */
  const stopCamera = useCallback(() => {
    videoCaptureService.stop()
    setState(s => ({
      ...s,
      isRecognizing: false,
      recognitionProgress: 0,
    }))
  }, [])

  /**
   * AUTHENTICATE — Capturar frame y autenticar
   *
   * Flujo:
   *   1. Capturar frame del video
   *   2. Analizar calidad del frame
   *   3. Si calidad ok → construir payload → enviar a facialService
   *   4. Retornar respuesta (éxito o fallo)
   *
   * @returns FacialAuthResponse o null si falla antes de enviar
   */
  const authenticate = useCallback(async (): Promise<FacialAuthResponse | null> => {
    if (!videoRef.current || !videoCaptureService.isActive()) {
      setState(s => ({ ...s, error: "Cámara no está activa" }))
      return null
    }

    setState(s => ({ ...s, isLoading: true, error: null, recognitionProgress: 10 }))

    try {
      // Paso 1: Capturar frame como base64
      const frameBase64 = frameCaptureService.captureFrame(videoRef.current)
      setState(s => ({ ...s, lastFrame: frameBase64, recognitionProgress: 30 }))

      // Paso 2: Analizar calidad del frame
      const imageData = frameCaptureService.extractImageData(videoRef.current)
      const quality = facialAuthService.validateFrameQuality(imageData)
      setState(s => ({ ...s, recognitionProgress: 50 }))

      if (!quality.isValid) {
        setState(s => ({
          ...s,
          isLoading: false,
          recognitionProgress: 0,
          error: quality.reason || "Calidad de imagen insuficiente",
        }))
        return null
      }

      // Paso 3: Construir payload
      const payload: FacialRecognitionPayload = {
        frameBase64,
        timestamp: Date.now(),
        metadata: {
          resolution: [videoRef.current.videoWidth, videoRef.current.videoHeight],
          quality: quality.confidence > 0.7 ? "high" : quality.confidence > 0.4 ? "medium" : "low",
          confidence: quality.confidence,
        },
      }

      setState(s => ({ ...s, recognitionProgress: 70 }))

      // Paso 4: Autenticar (mock hoy, backend futuro)
      const response = await facialAuthService.authenticate(payload)
      setState(s => ({ ...s, recognitionProgress: 100, isLoading: false }))

      if (!response.success) {
        setState(s => ({
          ...s,
          error: response.error || "Rostro no reconocido",
          recognitionProgress: 0,
        }))
      }

      return response
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error en autenticación facial"
      setState(s => ({
        ...s,
        isLoading: false,
        recognitionProgress: 0,
        error: msg,
      }))
      return null
    }
  }, [])

  /**
   * RESET — Limpiar errores y reiniciar progreso
   *
   * Útil para dar al usuario otra oportunidad
   */
  const reset = useCallback(() => {
    setState(s => ({
      ...s,
      error: null,
      recognitionProgress: 0,
      lastFrame: null,
    }))
  }, [])

  return {
    state,
    videoRef,
    startCamera,
    stopCamera,
    authenticate,
    reset,
    isCameraActive: videoCaptureService.isActive(),
  }
}
