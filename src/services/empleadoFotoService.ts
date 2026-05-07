/**
 * Empleado Foto Service — Captura y subida de foto facial del empleado
 *
 * Se usa en el formulario de registro de empleado para capturar la foto
 * que el backend usara como referencia para el reconocimiento facial.
 *
 * HOY: Guarda como base64 en memoria y devuelve una URL de objeto local
 * FUTURO: POST /empleados/:id/foto  (multipart/form-data)
 */

import { base64ToBlob } from "@/services/attendanceService"
// import { httpClient } from "@/lib/api/client"

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
   * @param video - Elemento HTMLVideoElement con stream activo
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
    // ====== HOY (sin backend) ======
    console.log(`[EmpleadoFotoService] Foto lista para subir. Empleado: ${empleadoId}, tamano: ${foto.blob.size} bytes`)
    // Simula latencia de red
    await new Promise(r => setTimeout(r, 300))

    // ====== FUTURO (con backend) ======
    // const form = new FormData()
    // form.append("foto", foto.blob, "foto_facial.jpg")
    // await httpClient.postForm(`/empleados/${empleadoId}/foto`, form)
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
