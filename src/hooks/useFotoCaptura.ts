/**
 * useFotoCaptura — Hook para capturar foto facial en el formulario de empleado
 *
 * Maneja: activar camara, mostrar preview, capturar frame, devolver Blob/base64.
 * NO hace login ni registro de asistencia. Solo captura y retorna.
 */

import { useState, useRef, useCallback, useEffect } from "react"
import { videoCaptureService } from "@/lib/facial/videoCapture"
import { empleadoFotoService } from "@/services/empleadoFotoService"
import type { FotoCapturaResult } from "@/services/empleadoFotoService"

export type EstadoCaptura = "idle" | "iniciando" | "activa" | "capturada" | "error"

export interface FotoCapturaState {
  estado: EstadoCaptura
  previewUrl: string | null
  fotoCaptada: FotoCapturaResult | null
  error: string | null
}

const ESTADO_INICIAL: FotoCapturaState = {
  estado: "idle",
  previewUrl: null,
  fotoCaptada: null,
  error: null,
}

export function useFotoCaptura() {
  const [state, setState] = useState<FotoCapturaState>(ESTADO_INICIAL)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      videoCaptureService.stop()
      if (state.fotoCaptada?.previewUrl) {
        empleadoFotoService.revocarPreview(state.fotoCaptada.previewUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activarCamara = useCallback(async () => {
    if (!videoRef.current) return
    setState(s => ({ ...s, estado: "iniciando", error: null }))
    try {
      await videoCaptureService.start(videoRef.current, {
        width: 640, height: 480, facingMode: "user",
      })
      setState(s => ({ ...s, estado: "activa" }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo acceder a la camara"
      setState(s => ({ ...s, estado: "error", error: msg }))
    }
  }, [])

  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !videoCaptureService.isActive()) {
      setState(s => ({ ...s, error: "Camara no activa", estado: "error" }))
      return
    }
    try {
      // Revocar preview anterior si existe
      if (state.fotoCaptada?.previewUrl) {
        empleadoFotoService.revocarPreview(state.fotoCaptada.previewUrl)
      }
      const resultado = empleadoFotoService.capturarFoto(videoRef.current)
      videoCaptureService.stop()
      setState({
        estado: "capturada",
        previewUrl: resultado.previewUrl,
        fotoCaptada: resultado,
        error: null,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al capturar foto"
      setState(s => ({ ...s, estado: "error", error: msg }))
    }
  }, [state.fotoCaptada])

  const reiniciar = useCallback(() => {
    videoCaptureService.stop()
    if (state.fotoCaptada?.previewUrl) {
      empleadoFotoService.revocarPreview(state.fotoCaptada.previewUrl)
    }
    setState(ESTADO_INICIAL)
  }, [state.fotoCaptada])

  return { state, videoRef, activarCamara, capturarFoto, reiniciar }
}
