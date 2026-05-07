/**
 * useFacialAttendance — Hook para registro de asistencia facial
 *
 * Similar a useFacialAuth pero:
 * - Llama attendanceService.register() en vez de facialAuthService.authenticate()
 * - Retorna AttendanceResponse (no hace login, no toca AuthContext)
 * - Tiene estado isSuccess para mostrar confirmación post-registro
 */

import { useState, useRef, useCallback, useEffect } from "react"
import type { AttendanceState } from "@/types/attendance"
import type { AttendanceResponse } from "@/types/attendance"
import { videoCaptureService } from "@/lib/facial/videoCapture"
import { frameCaptureService } from "@/lib/facial/frameCapture"
import { facialAuthService } from "@/services/facialService"
import { attendanceService } from "@/services/attendanceService"

const INITIAL_STATE: AttendanceState = {
  isLoading: false,
  isRecognizing: false,
  isSuccess: false,
  error: null,
  recognitionProgress: 0,
  result: null,
}

export function useFacialAttendance() {
  const [state, setState] = useState<AttendanceState>(INITIAL_STATE)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    return () => {
      videoCaptureService.stop()
      frameCaptureService.dispose()
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      setState(s => ({ ...s, error: "Elemento de video no listo" }))
      return
    }
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      await videoCaptureService.start(videoRef.current, {
        width: 640, height: 480, facingMode: "user",
      })
      setState(s => ({ ...s, isLoading: false, isRecognizing: true, error: null }))
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al acceder a la cámara"
      setState(s => ({ ...s, isLoading: false, isRecognizing: false, error: msg }))
    }
  }, [])

  const stopCamera = useCallback(() => {
    videoCaptureService.stop()
    setState(s => ({ ...s, isRecognizing: false, recognitionProgress: 0 }))
  }, [])

  const registerAttendance = useCallback(async (): Promise<AttendanceResponse | null> => {
    if (!videoRef.current || !videoCaptureService.isActive()) {
      setState(s => ({ ...s, error: "Cámara no está activa" }))
      return null
    }

    setState(s => ({ ...s, isLoading: true, error: null, recognitionProgress: 10 }))

    try {
      const frameBase64 = frameCaptureService.captureFrame(videoRef.current)
      setState(s => ({ ...s, recognitionProgress: 30 }))

      const imageData = frameCaptureService.extractImageData(videoRef.current)
      const quality = facialAuthService.validateFrameQuality(imageData)
      setState(s => ({ ...s, recognitionProgress: 50 }))

      if (!quality.isValid) {
        setState(s => ({ ...s, isLoading: false, recognitionProgress: 0, error: quality.reason || "Calidad de imagen insuficiente" }))
        return null
      }

      const qualityLevel: "low" | "medium" | "high" =
        quality.confidence > 0.7 ? "high" : quality.confidence > 0.4 ? "medium" : "low"

      const payload = {
        frameBase64,
        timestamp: Date.now(),
        metadata: {
          resolution: [videoRef.current.videoWidth, videoRef.current.videoHeight] as [number, number],
          quality: qualityLevel,
          confidence: quality.confidence,
        },
      }

      setState(s => ({ ...s, recognitionProgress: 70 }))

      const response = await attendanceService.register(payload)
      setState(s => ({ ...s, recognitionProgress: 100, isLoading: false }))

      if (response.success) {
        videoCaptureService.stop()
        setState(s => ({ ...s, isRecognizing: false, isSuccess: true, result: response }))
      } else {
        setState(s => ({ ...s, error: response.error || "Rostro no reconocido", recognitionProgress: 0 }))
      }

      return response
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al registrar asistencia"
      setState(s => ({ ...s, isLoading: false, recognitionProgress: 0, error: msg }))
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  return { state, videoRef, startCamera, stopCamera, registerAttendance, reset }
}
