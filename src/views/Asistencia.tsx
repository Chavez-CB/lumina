// Módulo de Asistencia — marcación facial real via backend
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScanFace, CheckCircle2, XCircle, Camera, CameraOff,
  Sparkles, Clock, ChevronDown, Activity,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { attendanceService } from "../services/attendanceService";
import type { AttendanceResponse } from "../types/attendance";
import { empleadoFotoService } from "../services/empleadoFotoService";

type EstadoCamara = "off" | "iniciando" | "buscando" | "reconocido" | "error";

interface Marcacion {
  empleadoId: string;
  nombre: string;
  hora: string;
  tipo: "entrada" | "salida";
  confidence?: number;
}

interface Area {
  id: string;
  nombre: string;
}

// Áreas disponibles — en el futuro puede venir de GET /api/areas
const AREAS_DEFAULT: Area[] = [
  { id: "1", nombre: "Administración" },
  { id: "2", nombre: "Tecnología" },
  { id: "3", nombre: "Ventas" },
  { id: "4", nombre: "Logística" },
  { id: "5", nombre: "Recursos Humanos" },
  { id: "6", nombre: "Finanzas" },
  { id: "7", nombre: "Marketing" },
];

// Constantes de timing
const SCAN_INTERVAL_MS = 2500;
const RECONOCIDO_DURATION_MS = 4000;
const ERROR_DURATION_MS = 2000;
const MAX_HISTORIAL_SESSION = 10;

export default function Asistencia() {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [estado, setEstado]           = useState<EstadoCamara>("off");
  const [reconocido, setReconocido]   = useState<AttendanceResponse | null>(null);
  const [historial, setHistorial]     = useState<Marcacion[]>([]);
  const [hayCamara, setHayCamara]     = useState(true);
  const [procesando, setProcesando]   = useState(false);
  const [areaId, setAreaId]           = useState<string>(AREAS_DEFAULT[0].id);
  const [showAreaSel, setShowAreaSel] = useState(false);
  const areaSelRef = useRef<HTMLDivElement>(null);

  // Activar cámara al montar
  useEffect(() => {
    iniciarCamara();
    return () => { detenerCamara(); limpiarTimer(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar selector de área al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (areaSelRef.current && !areaSelRef.current.contains(e.target as Node)) {
        setShowAreaSel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const limpiarTimer = () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = null;
  };

  // Captura un frame del video y lo envía al backend
  const capturarYEnviar = useCallback(async () => {
    if (!videoRef.current || procesando) return;
    const video = videoRef.current;

    try {
      const foto = empleadoFotoService.capturarFoto(video, 0.85);
      setProcesando(true);

      const respuesta = await attendanceService.register({
        frameBase64: foto.base64,
        timestamp: Date.now(),
        areaId,
        metadata: {
          resolution: [video.videoWidth || 640, video.videoHeight || 480],
          quality: "high",
          confidence: 1.0,
        },
      });

      empleadoFotoService.revocarPreview(foto.previewUrl);

      if (respuesta.found && respuesta.nombre) {
        const hora = new Date().toLocaleTimeString("es-PE", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        });

        setReconocido(respuesta);
        setEstado("reconocido");
        setHistorial(h => [{
          empleadoId: String(respuesta.persona_id ?? ""),
          nombre: respuesta.nombre!,
          hora,
          tipo: respuesta.tipo ?? "entrada",
          confidence: respuesta.face?.confidence,
        }, ...h].slice(0, MAX_HISTORIAL_SESSION));

        toast.success(respuesta.nombre, {
          description: `${respuesta.tipo === "salida" ? "Salida" : "Entrada"} registrada · ${hora}`,
        });

        setTimeout(() => {
          setReconocido(null);
          setEstado("buscando");
          setProcesando(false);
          agendarScan();
        }, RECONOCIDO_DURATION_MS);
      } else {
        setEstado("error");
        setProcesando(false);
        setTimeout(() => {
          setEstado("buscando");
          agendarScan();
        }, ERROR_DURATION_MS);
      }
    } catch {
      setEstado("error");
      setProcesando(false);
      setTimeout(() => {
        setEstado("buscando");
        agendarScan();
      }, ERROR_DURATION_MS);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procesando, areaId]);

  const agendarScan = useCallback(() => {
    limpiarTimer();
    scanTimerRef.current = setTimeout(() => {
      capturarYEnviar();
    }, SCAN_INTERVAL_MS);
  }, [capturarYEnviar]);

  // Iniciar el bucle cuando el estado pasa a "buscando"
  useEffect(() => {
    if (estado === "buscando") {
      agendarScan();
    } else {
      limpiarTimer();
    }
    return limpiarTimer;
  }, [estado, agendarScan]);

  const iniciarCamara = async () => {
    setEstado("iniciando");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setHayCamara(true);
      setEstado("buscando");
    } catch {
      setHayCamara(false);
      setEstado("off");
      toast.error("No se pudo acceder a la cámara", {
        description: "Verifica los permisos del navegador.",
      });
    }
  };

  const detenerCamara = () => {
    limpiarTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setEstado("off");
    setProcesando(false);
  };

  const colorBorde =
    estado === "reconocido" ? "border-primary shadow-glow" :
    estado === "error"      ? "border-accent shadow-accent-glow" :
    "border-border";

  const areaNombre = AREAS_DEFAULT.find(a => a.id === areaId)?.nombre ?? "—";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marcación facial</h2>
          <p className="text-sm text-muted-foreground">Posiciónate frente a la cámara para registrar tu asistencia.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector de área */}
          <div className="relative" ref={areaSelRef}>
            <button
              onClick={() => setShowAreaSel(s => !s)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted/40 transition-base shadow-soft"
            >
              <Activity className="h-4 w-4 text-primary" />
              <span>{areaNombre}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", showAreaSel && "rotate-180")} />
            </button>
            {showAreaSel && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-elevated z-20 overflow-hidden animate-scale-in">
                {AREAS_DEFAULT.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setAreaId(a.id); setShowAreaSel(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-base",
                      a.id === areaId && "text-primary font-semibold bg-primary-soft"
                    )}
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {estado === "off" ? (
            <Button onClick={iniciarCamara} className="bg-gradient-primary">
              <Camera className="h-4 w-4 mr-2" />Activar cámara
            </Button>
          ) : (
            <Button variant="outline" onClick={detenerCamara}>
              <CameraOff className="h-4 w-4 mr-2" />Detener
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Cámara */}
        <div className="lg:col-span-3">
          <div className={cn("relative rounded-3xl overflow-hidden border-4 transition-smooth bg-foreground", colorBorde)}>
            <div className="aspect-[4/3] relative bg-foreground">
              {hayCamara ? (
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  autoPlay muted playsInline
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-background gap-3">
                  <CameraOff className="h-12 w-12 opacity-50" />
                  <p className="text-sm opacity-80">Cámara no disponible</p>
                  <Button size="sm" variant="secondary" onClick={iniciarCamara}>Reintentar</Button>
                </div>
              )}

              {/* Overlay buscando */}
              {estado === "buscando" && hayCamara && (
                <>
                  <div className="absolute inset-12 border-2 border-dashed border-primary/60 rounded-3xl animate-pulse-ring" />
                  <div className="absolute left-12 right-12 top-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground/70 backdrop-blur-md text-background text-xs font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {procesando ? "Procesando..." : "Buscando rostro..."}
                  </div>
                </>
              )}

              {/* Marco verde reconocido */}
              {estado === "reconocido" && (
                <div className="absolute inset-12 border-4 border-primary rounded-3xl animate-scale-in shadow-glow flex items-end justify-center pb-3">
                  <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reconocido
                  </div>
                </div>
              )}

              {/* Marco rojo error */}
              {estado === "error" && (
                <div className="absolute inset-12 border-4 border-accent rounded-3xl animate-scale-in shadow-accent-glow flex items-end justify-center pb-3">
                  <div className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" /> Rostro no identificado
                  </div>
                </div>
              )}
            </div>

            {/* Barra inferior de estado */}
            <div className="bg-card p-4 flex items-center justify-between border-t border-border">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  estado === "reconocido" ? "bg-primary-soft text-primary" :
                  estado === "error"      ? "bg-accent-soft text-accent" :
                  "bg-muted text-muted-foreground"
                )}>
                  <ScanFace className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {estado === "iniciando"  && "Iniciando cámara..."}
                    {estado === "buscando"   && (procesando ? "Procesando reconocimiento..." : "Escaneando...")}
                    {estado === "reconocido" && (reconocido?.nombre ?? "Reconocido")}
                    {estado === "error"      && "Rostro no reconocido"}
                    {estado === "off"        && "Cámara apagada"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {estado === "reconocido" && reconocido?.face && (
                      `Confianza: ${(reconocido.face.confidence * 100).toFixed(1)}% · ${reconocido.tipo === "salida" ? "Salida" : "Entrada"}`
                    )}
                    {estado === "buscando" && `Área: ${areaNombre}`}
                    {estado === "error"    && "Intenta acercarte a la cámara."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Hora actual</p>
                <p className="font-mono font-semibold">{new Date().toLocaleTimeString("es-PE")}</p>
              </div>
            </div>
          </div>

          {/* Banner de éxito */}
          {reconocido?.found && reconocido.nombre && (
            <div className="mt-4 rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow flex items-center gap-4 animate-scale-in">
              <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/40 flex-shrink-0">
                <ScanFace className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider opacity-90">¡Marcación exitosa!</p>
                </div>
                <p className="font-bold text-lg truncate">{reconocido.nombre}</p>
                <p className="text-sm opacity-90">
                  {reconocido.tipo === "salida" ? "Salida" : "Entrada"} registrada
                  {reconocido.asistencia?.hora_entrada && ` · entrada: ${reconocido.asistencia.hora_entrada}`}
                  {reconocido.face && ` · ${(reconocido.face.confidence * 100).toFixed(1)}% confianza`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral: historial de la sesión */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-semibold mb-1">Marcaciones recientes</h3>
            <p className="text-xs text-muted-foreground mb-4">Esta sesión · {areaNombre}</p>
            <div className="space-y-2">
              {historial.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aún sin marcaciones.
                </div>
              ) : historial.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 animate-fade-in-up">
                  <div className="h-9 w-9 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                    <ScanFace className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.nombre}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.tipo}
                      {m.confidence != null && ` · ${(m.confidence * 100).toFixed(0)}%`}
                    </p>
                  </div>
                  <p className="text-sm font-mono flex-shrink-0">{m.hora}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
            <p className="text-xs uppercase tracking-wider opacity-90 mb-2">Tip de seguridad</p>
            <p className="text-sm leading-relaxed">
              Asegúrate de tener buena iluminación frontal y retirar accesorios que oculten
              parte del rostro para una detección más precisa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
