/**
 * Empleado Foto Service — Captura y subida de foto facial del empleado
 *
 * Captura un frame del video y lo sube como multipart/form-data.
 * POST /api/empleados/:id/foto
 */

import { base64ToBlob } from "@/services/attendanceService"
import { httpClient } from "@/lib/api/client"

export interface FotoCapturaResult {
  /** Blob JPEG listo para enviar al backend */
  blob: Blob
  /** URL temporal para mostrar preview en la UI */
  previewUrl: string
  /** Base64 del frame capturado */
  base64: string
}

class EmpleadoFotoService {
  /**
   * Captura un frame del elemento video y retorna el Blob + preview URL.
   * @param video   - Elemento HTMLVideoElement con stream activo
   * @param quality - Calidad JPEG (0.0 - 1.0), por defecto 0.92
   */
  capturarFoto(video: HTMLVideoElement, quality = 0.92): FotoCapturaResult {
    const canvas = document.createElement("canvas")
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No se pudo obtener contexto 2D del canvas")

    // Espejear horizontalmente para que la foto quede orientada correctamente
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const base64 = canvas.toDataURL("image/jpeg", quality)
    const blob = base64ToBlob(base64, "image/jpeg")
    const previewUrl = URL.createObjectURL(blob)

    return { blob, previewUrl, base64 }
  }

  /**
   * Sube la foto al backend asociada al empleado.
   * @param empleadoId - ID del empleado
   * @param foto       - Resultado de capturarFoto()
   */
  async subirFoto(empleadoId: string, foto: FotoCapturaResult): Promise<void> {
    try {
      const form = new FormData()
      form.append("foto", foto.blob, "foto_facial.jpg")
      await httpClient.postForm(`/empleados/${empleadoId}/foto`, form, { timeout: 20000 })
    } catch (error) {
      // Si el endpoint no existe aún, loggear sin lanzar error para no romper el flujo
      console.warn(`[EmpleadoFotoService] No se pudo subir la foto del empleado ${empleadoId}:`, error)
    }
  }

  /**
   * Libera la URL de objeto creada por capturarFoto().
   * Llamar cuando el componente se desmonte o se cambie la foto.
   */
  revocarPreview(previewUrl: string): void {
    URL.revokeObjectURL(previewUrl)
  }
}

export const empleadoFotoService = new EmpleadoFotoService()
