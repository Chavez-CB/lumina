import { useState, useEffect } from "react";
import { ShieldCheck, ScanFace, Sparkles, KeyRound } from "lucide-react";
import { useAuth, useRouter } from "../components/App";
import { toast } from "sonner";
import CredentialAuth from "../components/CredentialAuth";
import FacialAttendance from "../components/FacialAttendance";
import type { LoginResponse } from "../types/auth";

export default function Login() {
  const { loginWithCredentials, isAuthenticated } = useAuth();
  const { navigate } = useRouter();
  const [showAttendance, setShowAttendance] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const handleCredentialSuccess = (_response: LoginResponse) => {
    toast.success("Bienvenido al sistema", { description: "Sesión iniciada correctamente." });
    navigate("/");
  };

  const handleError = (error: string) => {
    toast.error("Error de autenticación", { description: error });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">

      {/* ── Panel izquierdo — branding ── */}
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

      {/* ── Panel derecho ── */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground mb-3">
              <KeyRound className="h-3 w-3" /> Solo administradores
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Acceso al panel</h1>
            <p className="text-muted-foreground text-sm">
              Ingresa tus credenciales para acceder al sistema de administración.
            </p>
          </div>

          {/* Formulario credenciales */}
          <CredentialAuth
            onSuccess={handleCredentialSuccess}
            onError={handleError}
            loginFn={loginWithCredentials}
          />

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">¿Eres empleado?</span>
            </div>
          </div>

          {/* Botón asistencia facial */}
          <button
            id="btn-asistencia-facial"
            onClick={() => setShowAttendance(true)}
            className="w-full h-14 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-base flex items-center justify-center gap-3 group"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <ScanFace className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-foreground">Registrar Asistencia Facial</p>
              <p className="text-xs text-muted-foreground">Marca tu entrada o salida</p>
            </div>
          </button>

        </div>
      </div>

      {/* ── Modal asistencia ── */}
      {showAttendance && (
        <FacialAttendance onClose={() => setShowAttendance(false)} />
      )}
    </div>
  );
}
