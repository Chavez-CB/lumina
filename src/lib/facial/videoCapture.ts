/**
 * Video Capture — Gestión de stream de cámara
 * 
 * Responsabilidades:
 * - Solicitar acceso a cámara (getUserMedia)
 * - Asignar stream a elemento <video>
 * - Parar stream (liberar cámara)
 * - Consultar estado
 * 
 * Uso:
 *   const capture = videoCaptureService
 *   await capture.start(videoRef.current)
 *   await capture.stop()
 */

import type { VideoCaptureOptions } from "@/types/facial"

export class VideoCapture {
  private stream: MediaStream | null = null

  /**
   * START — Solicitar acceso a cámara
   * 
   * Dispara popup: "¿Permitir acceso a cámara?"
   * Si usuario acepta → asigna stream a <video>
   * Si rechaza → lanza error
   * 
   * @param videoElement - <video> donde mostrar stream
   * @param options - configuración (resolución, facing mode)
   * @returns Promise<MediaStream>
   * @throws Error si usuario rechaza o no hay cámara
   */
  async start(
    videoElement: HTMLVideoElement,
    options: VideoCaptureOptions = {}
  ): Promise<MediaStream> {
    const { width = 640, height = 480, facingMode = "user" } = options

    try {
      // Solicitar acceso a cámara
      // Esto dispara popup en el navegador
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode,
        },
        audio: false, // No necesitamos audio
      })

      // Asignar stream a <video> para que muestre en vivo
      // srcObject = nueva forma estándar (reemplaza .src)
      videoElement.srcObject = this.stream

      return this.stream
    } catch (error) {
      // Errores comunes:
      // - NotAllowedError: usuario rechazó permiso
      // - NotFoundError: no hay cámara en el dispositivo
      // - NotReadableError: otra app está usando cámara
      const message = error instanceof Error ? error.message : "Unknown error"
      throw new Error(`Failed to start video capture: ${message}`)
    }
  }

  /**
   * STOP — Parar stream y liberar cámara
   * 
   * Importante llamar en cleanup (cuando abandone componente)
   * Si no se llama → cámara sigue activa
   */
  stop(): void {
    if (!this.stream) return

    // Detener todos los tracks (video, audio, etc)
    // Un MediaStream puede tener múltiples tracks
    this.stream.getTracks().forEach(track => {
      track.stop()  // Libera acceso a hardware
    })

    this.stream = null
  }

  /**
   * GETSTREAM — Obtener stream actual
   * 
   * Útil si necesita manipularlo después
   * 
   * @returns MediaStream actual o null si no activo
   */
  getStream(): MediaStream | null {
    return this.stream
  }

  /**
   * ISACTIVE — ¿Stream activo?
   * 
   * @returns true si hay stream activo, false en caso contrario
   */
  isActive(): boolean {
    return this.stream ? this.stream.active : false
  }
}

/**
 * Singleton exportado
 * 
 * Importar con:
 *   import { videoCaptureService } from "@/lib/facial/videoCapture"
 *   await videoCaptureService.start(videoRef.current)
 */
export const videoCaptureService = new VideoCapture()
