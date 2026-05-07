import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard, Users, BadgePercent, Receipt,
  BarChart3, History, Settings, LogOut, Menu, X, Moon, Sun, Bell, ShieldCheck,
  Clock, UserX, AlertCircle,
} from "lucide-react";
import type { Route } from "../../lib/routes";
import { useAuth, useTheme, useRouter } from "../App";
import { cn } from "../../lib/utils";
import { notificacionService } from "../../services/notificacionService";
import type { Notificacion } from "../../services/notificacionService";

const nav: { to: Route; label: string; icon: React.ElementType }[] = [
  { to: "/",            label: "Dashboard",    icon: LayoutDashboard },
  { to: "/empleados",   label: "Empleados",    icon: Users           },
  { to: "/descuentos",  label: "Descuentos",   icon: BadgePercent    },
  { to: "/impuestos",   label: "Impuestos",    icon: Receipt         },
  { to: "/estadisticas",label: "Estadisticas", icon: BarChart3       },
  { to: "/historial",   label: "Historial",    icon: History         },
  { to: "/configuracion",label: "Configuracion",icon: Settings       },
];

const TIPO_META: Record<Notificacion["tipo"], { label: string; color: string; icon: typeof Clock }> = {
  tardanza:   { label: "Tardanza registrada", color: "text-warning",  icon: Clock       },
  ausencia:   { label: "Ausencia registrada", color: "text-accent",   icon: UserX       },
  sin_marcar: { label: "Sin marcar entrada",  color: "text-warning",  icon: AlertCircle },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const { theme, toggle } = useTheme();
  const { route, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState<Notificacion[]>(() => notificacionService.getNotificaciones());
  const notifRef = useRef<HTMLDivElement>(null);

  const titulo = nav.find(n => n.to === route)?.label ?? "Sistema";

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const marcarLeidas = () => {
    notificacionService.marcarTodasLeidas();
    setNotifs([]);
    setShowNotif(false);
  };

  function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
    return (
      <>
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sidebar-foreground leading-tight">Lumina</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Asistencia Facial</p>
            </div>
          </div>
          <button className="lg:hidden p-2 rounded-md hover:bg-muted/40" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map(item => {
            const isActive = route === item.to;
            return (
              <button
                key={item.to}
                onClick={() => { navigate(item.to); onNavigate(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-base",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-primary")} />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Version Demo</p>
            <p className="text-sm mt-1">Datos simulados para demostracion del sistema.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </aside>

      {/* Sidebar movil */}
      <div className={cn(
        "lg:hidden fixed inset-0 z-40 transition-opacity",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className={cn(
          "absolute inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border transition-transform flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      {/* Contenido */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-md hover:bg-muted/40" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg lg:text-xl font-semibold tracking-tight">{titulo}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notificaciones */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotif(s => !s)}
                  className="relative p-2 rounded-md hover:bg-muted/40 transition-base"
                  aria-label="Notificaciones"
                >
                  <Bell className="h-5 w-5" />
                  {notifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                      {notifs.length > 9 ? "9+" : notifs.length}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-elevated z-50 overflow-hidden animate-scale-in">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Notificaciones</p>
                        <p className="text-xs text-muted-foreground">
                          {notifs.length > 0 ? `${notifs.length} alertas hoy` : "Sin alertas hoy"}
                        </p>
                      </div>
                      {notifs.length > 0 && (
                        <button
                          onClick={marcarLeidas}
                          className="text-xs text-primary hover:underline"
                        >
                          Marcar leidas
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto scrollbar-thin">
                      {notifs.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          Sin alertas por ahora.
                        </div>
                      ) : (
                        notifs.map(n => {
                          const meta = TIPO_META[n.tipo];
                          const Icon = meta.icon;
                          return (
                            <div key={n.id} className="flex items-start gap-3 p-3 hover:bg-muted/40 transition-base border-b border-border/50 last:border-0">
                              <div className={`mt-0.5 h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{n.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  {meta.label}{n.hora ? ` · ${n.hora}` : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="p-2 rounded-md hover:bg-muted/40" onClick={toggle} aria-label="Cambiar tema">
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium leading-tight">{user?.username ?? "Admin"}</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {(user?.username ?? "A")[0].toUpperCase()}
                </div>
              </div>
              <button className="p-2 rounded-md hover:bg-muted/40" onClick={handleLogout} aria-label="Cerrar sesion">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
