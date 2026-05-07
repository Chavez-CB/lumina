import { useState, useEffect } from "react";
import { ShieldCheck, ScanFace, Sparkles, KeyRound } from "lucide-react";
import { useAuth, useRouter } from "../components/App";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import CredentialAuth from "../components/CredentialAuth";
import FacialAuth from "../components/FacialAuth";
import type { LoginResponse } from "../types/auth";
import type { FacialAuthResponse } from "../types/facial";

type AuthMethod = "credentials" | "facial";

export default function Login() {
  const { loginWithFacial, loginWithCredentials, isAuthenticated } = useAuth();
  const { navigate } = useRouter();
  const [method, setMethod] = useState<AuthMethod>("credentials");

  // Redirigir si ya autenticado
  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // Callback para login por credenciales (authService ya persistió en contexto)
  const handleCredentialSuccess = (_response: LoginResponse) => {
    toast.success("Bienvenido al sistema", { description: "Sesión iniciada correctamente." });
    navigate("/");
  };

  // Callback para login por facial
  const handleFacialSuccess = async (response: FacialAuthResponse) => {
    const ok = await loginWithFacial(response);
    if (ok) {
      toast.success("Rostro reconocido", { description: `Bienvenido, ${response.user?.nombre ?? response.user?.username}.` });
      navigate("/");
    } else {
      toast.error("Error al iniciar sesión facial", { description: "Intenta de nuevo." });
    }
  };

  const handleError = (error: string) => {
    toast.error("Error de autenticación", { description: error });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">

      {/* ── Panel izquierdo — branding (sin cambios) ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-xl tracking-tight">Lumina</p>
            <p className="text-xs uppercase tracking-widest opacity-80">Asistencia Facial Empresarial</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Plataforma certificada · v2.4
          </div>
          <h2 className="text-5xl font-bold leading-[1.05] tracking-tight">
            Control de personal con <span className="italic font-light">reconocimiento facial</span> en tiempo real.
          </h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Marcaciones automáticas, cálculo inteligente de descuentos e impuestos,
            y reportes visuales para tomar decisiones que importan.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { k: "98.7%", v: "Precisión facial" },
              { k: "<2s",   v: "Tiempo de marcación" },
              { k: "0",     v: "Suplantaciones" },
            ].map(s => (
              <div key={s.v} className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/15">
                <p className="text-2xl font-bold">{s.k}</p>
                <p className="text-xs opacity-80 mt-0.5">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm opacity-80">
          <ScanFace className="h-5 w-5" />
          © {new Date().getFullYear()} Corporación Lumina S.A.C.
        </div>
      </div>

      {/* ── Panel derecho — two-option auth ── */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-7 animate-fade-in-up">

          {/* Logo móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="font-bold text-xl">Lumina</p>
          </div>

          {/* Encabezado */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
            <p className="text-muted-foreground text-sm">
              Elige cómo acceder al panel de administración.
            </p>
          </div>

          {/* ── Selector de método ── */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/60 border border-border">
            <button
              onClick={() => setMethod("credentials")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-base",
                method === "credentials"
                  ? "bg-background shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <KeyRound className="h-4 w-4" />
              Credenciales
            </button>
            <button
              onClick={() => setMethod("facial")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-base",
                method === "facial"
                  ? "bg-background shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ScanFace className="h-4 w-4" />
              Reconocimiento facial
            </button>
          </div>

          {/* ── Contenido condicional ── */}
          <div className="animate-fade-in-up" key={method}>
            {method === "credentials" ? (
              <CredentialAuth
                onSuccess={handleCredentialSuccess}
                onError={handleError}
                loginFn={loginWithCredentials}
              />
            ) : (
              <div className="space-y-4">
                <FacialAuth
                  onSuccess={handleFacialSuccess}
                  onError={handleError}
                  autoStart
                />
                <p className="text-center text-xs text-muted-foreground">
                  Posiciónate frente a la cámara y presiona{" "}
                  <span className="font-semibold text-foreground">Capturar y autenticar</span>.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
