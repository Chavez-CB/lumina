/**
 * Types para Facial Recognition
 * 
 * Define estructura de datos para captura, envío y respuesta facial
 */

// ============ DATOS QUE CAPTURA LA CÁMARA ============

/**
 * Payload enviado al backend para autenticación facial
 * Contiene: frame en base64, metadata, y opcionalmente embeddings
 */
export interface FacialRecognitionPayload {
  frameBase64: string                    // Imagen como JPEG en base64
  embeddings?: number[]                  // [FUTURO] Vector 512D del rostro
  timestamp: number                      // Milisegundos desde 1970
  metadata?: {
    resolution: [number, number]         // [ancho, alto] ej: [640, 480]
    quality: "low" | "medium" | "high"   // Claridad de la imagen
    confidence: number                   // 0-1: certeza que hay rostro
  }
}

// ============ RESPUESTA DEL BACKEND ============

/**
 * Respuesta del backend al validar rostro
 * Retorna usuario + token si éxito, o error si fallo
 */
export interface FacialAuthResponse {
  success: boolean                       // ¿Rostro reconocido?
  user?: {                               // Si success=true
    id: string                           // ID en base de datos
    username: string                     // "edward.montero"
    nombre: string                       // "Edward Montero"
  }
  token?: string                         // JWT o sesión token
  error?: string                         // Mensaje si falla
}

// ============ ESTADO DEL COMPONENTE UI ============

/**
 * Estado del componente FacialAuth
 * Indica qué está pasando mientras el usuario está frente a cámara
 */
export interface FacialAuthState {
  isLoading: boolean                     // ¿Esperando respuesta backend?
  isRecognizing: boolean                 // ¿Cámara activa buscando rostro?
  error: string | null                   // ¿Hubo error?
  lastFrame: string | null               // Última imagen capturada (base64)
  recognitionProgress: number            // 0-100: porcentaje de progreso
}

// ============ CALIDAD DE FRAME ============

/**
 * Resultado de análisis de calidad de fotograma
 * Determina si es usable antes de enviar al backend
 */
export interface FrameQualityResult {
  isValid: boolean                       // ¿Es lo suficientemente clara?
  confidence: number                     // 0-1: nivel de confianza
  brightness?: number                    // 0-255: luminancia promedio
  reason?: string                        // Por qué es o no válida
}

// ============ OPCIONES VIDEO ============

/**
 * Opciones para configurar captura de video
 */
export interface VideoCaptureOptions {
  width?: number                         // Resolución ancho (ideal: 640)
  height?: number                        // Resolución alto (ideal: 480)
  facingMode?: "user" | "environment"   // Frontal (user) o trasera (environment)
}
