// Módulo de Asistencia con simulación de reconocimiento facial
import { useEffect, useRef, useState } from "react";
import { ScanFace, CheckCircle2, XCircle, Camera, CameraOff, Sparkles, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { empleados, obtenerEmpleado, type Reconocido } from "../lib/mockData";
import { toast } from "sonner";
import { cn } from "../lib/utils";

type EstadoCamara = "off" | "iniciando" | "buscando" | "reconocido" | "error";

interface Marcacion {
  empleadoId: string;
  hora: string;
  tipo: "entrada" | "salida";
  estado: "puntual" | "tardanza";
}

// Constantes de timing y probabilidades
const SCAN_INTERVAL_MS = 2200;
const RECONOCIDO_DURATION_MS = 3500;
const ERROR_DURATION_MS = 1800;
const RECONOCIMIENTO_PROB = 0.9;
const ENTRADA_THRESHOLD_HOURS = 6;
const TOLERANCIA_PUNTUALIDAD_MINS = 10;
const MAX_HISTORIAL_SESSION = 10;

export default function Asistencia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<EstadoCamara>("off");
  const [reconocido, setReconocido] = useState<Reconocido | null>(null);
  const [historialSesion, setHistorialSesion] = useState<Marcacion[]>([]);
  const [hayCamara, setHayCamara] = useState(true);

  // Activar cámara automáticamente al montar
  useEffect(() => {
    iniciarCamara();
    return () => detenerCamara();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

   // Bucle de "detección" simulado
   useEffect(() => {
     if (estado !== "buscando") return;
     const t = setTimeout(() => {
       if (Math.random() < RECONOCIMIENTO_PROB) {
         const emp = empleados[Math.floor(Math.random() * empleados.length)];
         const ahora = new Date();
         const hora = ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
         const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();
         const [hE, mE] = emp.horarioEntrada.split(":").map(Number);
         const tipo: "entrada" | "salida" = horaActualMin < (hE * 60 + 60 * ENTRADA_THRESHOLD_HOURS) ? "entrada" : "salida";
         const estadoMarca: "puntual" | "tardanza" = horaActualMin <= hE * 60 + TOLERANCIA_PUNTUALIDAD_MINS ? "puntual" : "tardanza";

         setReconocido({ empleado: emp, hora, tipo, estadoMarca });
         setEstado("reconocido");
         setHistorialSesion(h => [{ empleadoId: emp.id, hora, tipo, estado: estadoMarca }, ...h].slice(0, MAX_HISTORIAL_SESSION));
         toast.success(`${emp.nombre}`, { description: `${tipo === "entrada" ? "Entrada" : "Salida"} registrada · ${hora}` });

         setTimeout(() => {
           setReconocido(null);
           setEstado("buscando");
         }, RECONOCIDO_DURATION_MS);
       } else {
         setEstado("error");
         setTimeout(() => setEstado("buscando"), ERROR_DURATION_MS);
       }
     }, SCAN_INTERVAL_MS);
     return () => clearTimeout(t);
   }, [estado]);

   const iniciarCamara = async () => {
     setEstado("iniciando");
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
       streamRef.current = stream;
       if (videoRef.current) {
         videoRef.current.srcObject = stream;
       }
       setHayCamara(true);
       setEstado("buscando");
     } catch {
      setHayCamara(false);
      setEstado("off");
      toast.error("No se pudo acceder a la cámara", { description: "Verifica los permisos del navegador." });
    }
  };

  const detenerCamara = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setEstado("off");
  };

  const colorBorde =
    estado === "reconocido" ? "border-primary shadow-glow" :
    estado === "error" ? "border-accent shadow-accent-glow" :
    "border-border";

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marcación facial</h2>
          <p className="text-sm text-muted-foreground">Posiciónate frente a la cámara para registrar tu asistencia.</p>
        </div>
        <div className="flex items-center gap-2">
          {estado === "off" ? (
            <Button onClick={iniciarCamara} className="bg-gradient-primary"><Camera className="h-4 w-4 mr-2" />Activar cámara</Button>
          ) : (
            <Button variant="outline" onClick={detenerCamara}><CameraOff className="h-4 w-4 mr-2" />Detener</Button>
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

              {/* Overlay scan */}
              {estado === "buscando" && hayCamara && (
                <>
                  <div className="absolute inset-12 border-2 border-dashed border-primary/60 rounded-3xl animate-pulse-ring" />
                  <div className="absolute left-12 right-12 top-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground/70 backdrop-blur-md text-background text-xs font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Buscando rostro...
                  </div>
                </>
              )}

              {/* Marco verde reconocido */}
              {estado === "reconocido" && reconocido && (
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

            {/* Estado inferior */}
            <div className="bg-card p-4 flex items-center justify-between border-t border-border">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  estado === "reconocido" ? "bg-primary-soft text-primary" :
                  estado === "error" ? "bg-accent-soft text-accent" :
                  "bg-muted text-muted-foreground"
                )}>
                  <ScanFace className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {estado === "iniciando" && "Iniciando cámara..."}
                    {estado === "buscando" && "Escaneando..."}
                    {estado === "reconocido" && reconocido?.empleado.nombre}
                    {estado === "error" && "Rostro no reconocido"}
                    {estado === "off" && "Cámara apagada"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {estado === "reconocido" && reconocido && `${reconocido.empleado.cargo} · ${reconocido.tipo === "entrada" ? "Entrada" : "Salida"} ${reconocido.estadoMarca}`}
                    {estado === "buscando" && "Mantente quieto unos segundos."}
                    {estado === "error" && "Intenta acercarte a la cámara."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Hora actual</p>
                <p className="font-mono font-semibold">{new Date().toLocaleTimeString("es-PE")}</p>
              </div>
            </div>
          </div>

          {/* Animación de éxito flotante */}
          {reconocido && (
            <div className="mt-4 rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow flex items-center gap-4 animate-scale-in">
              <img src={reconocido.empleado.foto} alt={reconocido.empleado.nombre} className="h-14 w-14 rounded-full object-cover ring-4 ring-white/40" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider opacity-90">¡Marcación exitosa!</p>
                </div>
                <p className="font-bold text-lg truncate">{reconocido.empleado.nombre}</p>
                <p className="text-sm opacity-90">{reconocido.tipo === "entrada" ? "Entrada" : "Salida"} registrada a las {reconocido.hora}</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral: registros de la sesión */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-semibold mb-1">Marcaciones recientes</h3>
            <p className="text-xs text-muted-foreground mb-4">Esta sesión</p>
            <div className="space-y-2">
              {historialSesion.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aún sin marcaciones.
                </div>
              ) : historialSesion.map((m, i) => {
                const e = obtenerEmpleado(m.empleadoId);
                if (!e) return null;
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 animate-fade-in-up">
                    <img src={e.foto} alt={e.nombre} className="h-9 w-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.tipo} · {m.estado}</p>
                    </div>
                    <p className="text-sm font-mono">{m.hora}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
            <p className="text-xs uppercase tracking-wider opacity-90 mb-2">Tip de seguridad</p>
            <p className="text-sm leading-relaxed">
              Asegúrate de tener buena iluminación frontal y retirar accesorios que oculten parte del rostro
              para una detección más precisa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
