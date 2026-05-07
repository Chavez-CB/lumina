/**
 * FacialAttendance — Modal overlay de asistencia facial
 *
 * Abre como overlay desde Login.tsx al presionar "Asistencia Facial".
 * NO hace login. Solo registra asistencia y muestra confirmación.
 *
 * Uso:
 *   <FacialAttendance onClose={() => setShowAttendance(false)} />
 */

import { useEffect } from "react"
import {
  X, ScanFace, Camera, CameraOff, CheckCircle2, XCircle,
  Loader2, Clock, UserCheck, Sun, Sunrise, Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFacialAttendance } from "@/hooks/useFacialAttendance"

interface FacialAttendanceProps {
  onClose: () => void
}

const SHIFT_INFO = {
  mañana: { label: "Mañana", Icon: Sunrise, color: "text-amber-500" },
  tarde:  { label: "Tarde",  Icon: Sun,     color: "text-orange-500" },
  noche:  { label: "Noche",  Icon: Moon,    color: "text-indigo-500" },
} as const

export default function FacialAttendance({ onClose }: FacialAttendanceProps) {
  const { state, videoRef, startCamera, stopCamera, registerAttendance, reset } = useFacialAttendance()

  useEffect(() => { startCamera() }, [startCamera])

  const handleClose = () => { stopCamera(); onClose() }

  const formatTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""

  const borderColor =
    state.error       ? "border-accent shadow-accent-glow" :
    state.isLoading   ? "border-primary shadow-glow"       :
    state.isRecognizing ? "border-primary/50"              : "border-border"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-md p-4 animate-fade-in-up"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-hero text-primary-foreground">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ScanFace className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Asistencia Facial</p>
              <p className="text-xs opacity-75">Registro de empleados</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-base"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">

          {/* ── Pantalla de éxito ── */}
          {state.isSuccess && state.result?.employee ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="h-9 w-9 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">¡Asistencia registrada!</p>
                  <p className="text-muted-foreground text-sm">Tu marcación fue exitosa</p>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
                {/* Empleado */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-glow">
                    {state.result.employee.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{state.result.employee.nombre}</p>
                    <p className="text-xs text-muted-foreground">@{state.result.employee.username}</p>
                  </div>
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>

                {/* Hora + Turno */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-background p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">Hora</span>
                    </div>
                    <p className="font-bold text-sm">{formatTime(state.result.timestamp)}</p>
                  </div>
                  {state.result.shift && (() => {
                    const { label, Icon, color } = SHIFT_INFO[state.result!.shift!]
                    return (
                      <div className="rounded-lg bg-background p-2.5 border border-border">
                        <div className={cn("flex items-center gap-1.5 mb-1", color)}>
                          <Icon className="h-3 w-3" />
                          <span className="text-xs">Turno</span>
                        </div>
                        <p className="font-bold text-sm">{label}</p>
                      </div>
                    )
                  })()}
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full h-10 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 transition-base text-sm"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* ── Viewport cámara ── */}
              <div className={cn("relative rounded-xl overflow-hidden border-4 transition-smooth bg-foreground", borderColor)}>
                <div className="aspect-[4/3] relative">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    autoPlay muted playsInline
                  />

                  {/* Placeholder inactivo */}
                  {!state.isRecognizing && !state.isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-background gap-3">
                      <CameraOff className="h-10 w-10 opacity-40" />
                      <p className="text-sm opacity-70">Cámara inactiva</p>
                    </div>
                  )}

                  {/* Scan overlay */}
                  {state.isRecognizing && !state.isLoading && (
                    <>
                      <div className="absolute inset-10 border-2 border-dashed border-primary/60 rounded-3xl animate-pulse-ring" />
                      <div className="absolute left-10 right-10 top-10 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-foreground/70 backdrop-blur-md text-background text-xs font-medium flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Listo para capturar
                      </div>
                    </>
                  )}

                  {/* Loading */}
                  {state.isLoading && (
                    <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-9 w-9 text-primary animate-spin" />
                      <p className="text-background text-sm font-medium">Verificando identidad...</p>
                      <div className="w-36 h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${state.recognitionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error frame */}
                  {state.error && (
                    <div className="absolute inset-10 border-4 border-accent rounded-3xl animate-scale-in shadow-accent-glow flex items-end justify-center pb-3">
                      <div className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5" /> No reconocido
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer status */}
                <div className="bg-card p-2.5 flex items-center justify-between border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-7 w-7 rounded-md flex items-center justify-center",
                      state.isLoading ? "bg-primary-soft text-primary" :
                      state.error ? "bg-accent-soft text-accent" :
                      state.isRecognizing ? "bg-primary-soft text-primary" :
                      "bg-muted text-muted-foreground"
                    )}>
                      <ScanFace className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs font-medium">
                      {state.isLoading && "Analizando..."}
                      {state.error && "Error de reconocimiento"}
                      {!state.isLoading && !state.error && state.isRecognizing && "Cámara activa"}
                      {!state.isLoading && !state.error && !state.isRecognizing && "Cámara apagada"}
                    </p>
                  </div>
                  {state.isRecognizing && (
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      EN VIVO
                    </div>
                  )}
                </div>
              </div>

              {/* ── Controles ── */}
              <div className="flex gap-2">
                {!state.isRecognizing && !state.error ? (
                  <button
                    onClick={startCamera}
                    disabled={state.isLoading}
                    className="flex-1 h-10 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 transition-base disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                  >
                    <Camera className="h-4 w-4" /> Activar cámara
                  </button>
                ) : state.error ? (
                  <>
                    <button
                      onClick={reset}
                      className="flex-1 h-10 rounded-lg border border-border hover:bg-muted/50 transition-base text-sm font-medium"
                    >
                      Reintentar
                    </button>
                    <button
                      onClick={handleClose}
                      className="h-10 px-4 rounded-lg border border-border hover:bg-muted/50 transition-base text-sm"
                    >
                      Cerrar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={registerAttendance}
                      disabled={state.isLoading}
                      className="flex-1 h-10 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 transition-base disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                    >
                      {state.isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
                      ) : (
                        <><ScanFace className="h-4 w-4" /> Registrar Asistencia</>
                      )}
                    </button>
                    <button
                      onClick={() => { stopCamera(); reset() }}
                      disabled={state.isLoading}
                      className="h-10 px-3 rounded-lg border border-border hover:bg-muted/50 transition-base disabled:opacity-60"
                      aria-label="Detener cámara"
                    >
                      <CameraOff className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Asegúrate de tener buena iluminación frontal para mayor precisión.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
