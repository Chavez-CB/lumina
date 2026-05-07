/**
 * Frame Capture — Extrae fotogramas de video
 * 
 * Responsabilidades:
 * - Dibujar video en canvas
 * - Extraer frame como base64 (JPEG)
 * - Calcular y validar calidad del frame
 * 
 * Uso:
 *   const frameCapture = frameCaptureService
 *   const base64 = frameCapture.captureFrame(videoElement)
 *   const quality = frameCapture.analyzeQuality(imageData)
 */

import type { FrameQualityResult } from "@/types/facial"

export class FrameCapture {
  private canvas: HTMLCanvasElement | null = null

  /**
   * CAPTURAR FRAME — Convertir video a base64
   * 
   * Procesa:
   * 1. Obtiene canvas (crea si no existe)
   * 2. Dibuja frame actual del video
   * 3. Convierte a JPEG en base64
   * 
   * @param videoElement - <video> en vivo
   * @param quality - 0-1: calidad JPEG (0.85 por defecto)
   * @returns string en formato "data:image/jpeg;base64,..."
   * @throws Error si no puede obtener canvas context
   */
  captureFrame(
    videoElement: HTMLVideoElement,
    quality: number = 0.85
  ): string {
    const canvas = this.getCanvas(videoElement.videoWidth, videoElement.videoHeight)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Cannot get canvas context")
    }

    // Dibujar frame actual del video en canvas
    // drawImage(element, x, y, width, height)
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // Convertir canvas a JPEG en base64
    // Retorna: "data:image/jpeg;base64,/9j/4AAQSk..."
    return canvas.toDataURL("image/jpeg", quality)
  }

  /**
   * EXTRAER IMAGEDATA — Obtener pixels crudos
   * 
   * Útil para análisis de calidad (detectar luminancia, contraste)
   * ImageData contiene array de bytes RGBA
   * 
   * @param videoElement - <video> en vivo
   * @returns ImageData con pixels crudos
   * @throws Error si no puede obtener canvas context
   */
  extractImageData(videoElement: HTMLVideoElement): ImageData {
    const canvas = this.getCanvas(videoElement.videoWidth, videoElement.videoHeight)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Cannot get canvas context")
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // getImageData = obtener array de pixels
    // Cada pixel = [R, G, B, A] (4 bytes)
    // Ej: 640x480 = 307,200 pixels = 1,228,800 bytes
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  /**
   * ANALIZAR CALIDAD — ¿Es fotograma usable?
   * 
   * Busca:
   * - Luminancia óptima (no muy oscura, no muy clara)
   * - Calidad suficiente para procesar
   * 
   * Fórmula luminancia estándar:
   *   Y = 0.299*R + 0.587*G + 0.114*B
   * 
   * Rango óptimo: 50-200 (de 0-255)
   * 
   * @param imageData - pixels crudos del canvas
   * @returns FrameQualityResult con isValid y confidence
   */
  analyzeQuality(imageData: ImageData): FrameQualityResult {
    const data = imageData.data
    let brightness = 0

    // Recorrer todos los pixels
    // Cada pixel son 4 valores: R, G, B, Alpha
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Luminancia = 0.299*R + 0.587*G + 0.114*B (estándar BT.601)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      brightness += lum
    }

    // Promedio de luminancia de todos los pixels
    brightness = brightness / (data.length / 4)

    // Verificar si imagen está muy oscura o muy clara
    // Rango óptimo: 50-200 (de 0-255)
    const tooDark = brightness < 50
    const tooBright = brightness > 200

    // Calcular confianza: más cercano a 128 (neutral), mejor
    // 128 es el punto medio (0-255)
    const optimalBrightness = 128
    const brightnessError = Math.abs(brightness - optimalBrightness)
    const brightnessConfidence = Math.max(0, 1 - brightnessError / 128)

    // Frame válido si:
    // - No muy oscuro
    // - No muy claro
    // - Confianza > 40%
    const isValid = !tooDark && !tooBright && brightnessConfidence > 0.4

    return {
      isValid,
      confidence: brightnessConfidence,
      brightness: Math.round(brightness),
      reason: tooDark
        ? "Image too dark - improve lighting"
        : tooBright
        ? "Image too bright - reduce light"
        : undefined,
    }
  }

  /**
   * Obtener canvas (crear si no existe)
   * 
   * Reutiliza canvas para evitar crear múltiples
   * Crea nuevo si dimensiones cambian
   * 
   * @param width - ancho deseado
   * @param height - alto deseado
   * @returns canvas con dimensiones correctas
   */
  private getCanvas(width: number, height: number): HTMLCanvasElement {
    if (!this.canvas || this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas = document.createElement("canvas")
      this.canvas.width = width
      this.canvas.height = height
    }
    return this.canvas
  }

  /**
   * CLEANUP — Liberar recursos
   * 
   * Llamar si necesita limpiar memoria
   */
  dispose(): void {
    this.canvas = null
  }
}

/**
 * Singleton exportado
 * 
 * Importar con:
 *   import { frameCaptureService } from "@/lib/facial/frameCapture"
 *   const base64 = frameCaptureService.captureFrame(videoRef.current)
 */
export const frameCaptureService = new FrameCapture()
