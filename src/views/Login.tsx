import { useState, FormEvent, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, ScanFace, Sparkles, Lock, User } from "lucide-react";
import { useAuth, useRouter } from "../components/App";
import { toast } from "sonner";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { navigate } = useRouter();
  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(usuario.trim(), pass);
      if (ok) {
        toast.success("Bienvenido al sistema", { description: "Sesión iniciada correctamente." });
        navigate("/");
      } else {
        toast.error("Credenciales incorrectas", { description: "Verifica tu usuario y contraseña." });
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Panel izquierdo — branding */}
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
              { k: "<2s", v: "Tiempo de marcación" },
              { k: "0", v: "Suplantaciones" },
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

      {/* Panel derecho — formulario */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <p className="font-bold text-xl">Lumina</p>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
            <p className="text-muted-foreground">Accede al panel de administración del sistema de asistencia.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="usuario" className="text-sm font-medium">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="usuario"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-4 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="pass" className="text-sm font-medium">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="pass"
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-base"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 transition-base disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Ingresar al sistema"}
            </button>
          </form>

          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Credenciales demo</p>
            <div className="text-sm font-mono space-y-0.5">
              <p><span className="text-muted-foreground">Usuario:</span> <span className="font-semibold">admin</span></p>
              <p><span className="text-muted-foreground">Clave:</span> <span className="font-semibold">admin123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
