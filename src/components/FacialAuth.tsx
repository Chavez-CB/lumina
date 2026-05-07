/**
 * FacialAuth — UI de cámara para autenticación facial
 *
 * Muestra:
 * - Feed de video en vivo con overlay de escaneo (igual a Asistencia.tsx)
 * - Barra de progreso durante reconocimiento
 * - Estado visual: buscando / reconocido / error
 * - Botones: Iniciar / Detener / Capturar
 *
 * Consume: useFacialAuth (orquesta toda la lógica)
 * Al autenticar con éxito llama onSuccess(response).
 *
 * Uso:
 *   <FacialAuth onSuccess={(res) => loginWithResponse(res)} />
 */

import { useEffect } from "react"
import { ScanFace, Camera, CameraOff, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFacialAuth } from "@/hooks/useFacialAuth"
import type { FacialAuthResponse } from "@/types/facial"

interface FacialAuthProps {
  onSuccess: (response: FacialAuthResponse) => void
  onError?: (error: string) => void
  /** Si true, inicia la cámara automáticamente al montar */
  autoStart?: boolean
}

export default function FacialAuth({ onSuccess, onError, autoStart = false }: FacialAuthProps) {
  const { state, videoRef, startCamera, stopCamera, authenticate, reset } = useFacialAuth()

  // Auto-iniciar si el prop lo pide
  useEffect(() => {
    if (autoStart) {
      startCamera()
    }
  }, [autoStart, startCamera])

  const handleCapture = async () => {
    const response = await authenticate()

    if (!response) return // error ya seteado en state

    if (response.success) {
      onSuccess(response)
    } else {
      onError?.(response.error || "Rostro no reconocido")
    }
  }

  // Color del borde del video según estado
  const colorBorde =
    state.error
      ? "border-accent shadow-accent-glow"
      : state.isLoading
      ? "border-primary shadow-glow"
      : state.isRecognizing
      ? "border-primary/50"
      : "border-border"

  return (
    <div className="space-y-4">
      {/* Viewport de cámara */}
      <div className={cn("relative rounded-2xl overflow-hidden border-4 transition-smooth bg-foreground", colorBorde)}>
        <div className="aspect-[4/3] relative bg-foreground">
          {/* Video en vivo */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            autoPlay
            muted
            playsInline
          />

          {/* Placeholder si cámara apagada */}
          {!state.isRecognizing && !state.isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-background gap-3">
              <CameraOff className="h-12 w-12 opacity-40" />
              <p className="text-sm opacity-70">Cámara inactiva</p>
            </div>
          )}

          {/* Overlay scan animado (igual que Asistencia.tsx) */}
          {state.isRecognizing && !state.isLoading && (
            <>
              <div className="absolute inset-12 border-2 border-dashed border-primary/60 rounded-3xl animate-pulse-ring" />
              <div className="absolute left-12 right-12 top-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground/70 backdrop-blur-md text-background text-xs font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Listo para capturar
              </div>
            </>
          )}

          {/* Overlay cargando (procesando reconocimiento) */}
          {state.isLoading && (
            <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-background text-sm font-medium">Analizando rostro...</p>
              {/* Barra de progreso */}
              <div className="w-40 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${state.recognitionProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Marco verde — éxito */}
          {!state.isLoading && !state.error && state.recognitionProgress === 100 && (
            <div className="absolute inset-12 border-4 border-primary rounded-3xl animate-scale-in shadow-glow flex items-end justify-center pb-3">
              <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reconocido
              </div>
            </div>
          )}

          {/* Marco rojo — error */}
          {state.error && (
            <div className="absolute inset-12 border-4 border-accent rounded-3xl animate-scale-in shadow-accent-glow flex items-end justify-center pb-3">
              <div className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> {state.error.length > 28 ? "No reconocido" : state.error}
              </div>
            </div>
          )}
        </div>

        {/* Footer status del video */}
        <div className="bg-card p-3 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center",
              state.isLoading ? "bg-primary-soft text-primary" :
              state.error ? "bg-accent-soft text-accent" :
              state.isRecognizing ? "bg-primary-soft text-primary" :
              "bg-muted text-muted-foreground"
            )}>
              <ScanFace className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {state.isLoading && "Analizando..."}
                {state.error && "Error"}
                {!state.isLoading && !state.error && state.isRecognizing && "Cámara activa"}
                {!state.isLoading && !state.error && !state.isRecognizing && "Cámara apagada"}
              </p>
              <p className="text-xs text-muted-foreground">
                {state.error || (state.isRecognizing ? "Presiona capturar cuando estés listo" : "Activa la cámara para continuar")}
              </p>
            </div>
          </div>
          {/* Indicador live */}
          {state.isRecognizing && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              EN VIVO
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-2">
        {!state.isRecognizing ? (
          <button
            onClick={startCamera}
            disabled={state.isLoading}
            className="flex-1 h-10 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 transition-base disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            <Camera className="h-4 w-4" />
            Activar cámara
          </button>
        ) : (
          <>
            <button
              onClick={handleCapture}
              disabled={state.isLoading}
              className="flex-1 h-10 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 transition-base disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Capturar y autenticar
                </>
              )}
            </button>
            <button
              onClick={() => { stopCamera(); reset() }}
              disabled={state.isLoading}
              className="h-10 px-4 rounded-lg border border-border hover:bg-muted/50 transition-base disabled:opacity-60 text-sm"
              aria-label="Detener cámara"
            >
              <CameraOff className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Reintentar si hay error */}
        {state.error && (
          <button
            onClick={reset}
            className="h-10 px-4 rounded-lg border border-accent/30 bg-accent-soft text-accent hover:bg-accent/20 transition-base text-sm font-medium"
          >
            Reintentar
          </button>
        )}
      </div>

      {/* Tip iluminación */}
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Consejo:</span> Asegúrate de tener buena iluminación
        frontal y evita fondos muy brillantes para mayor precisión.
      </div>
    </div>
  )
}
