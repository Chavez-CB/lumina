import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { Route } from "../lib/routes";
import { Toaster } from "./ui/sonner";
import AppLayout from "./layout/AppLayout";
import Dashboard from "../views/Dashboard";
import Asistencia from "../views/Asistencia";
import Empleados from "../views/Empleados";
import Descuentos from "../views/Descuentos";
import Impuestos from "../views/Impuestos";
import Estadisticas from "../views/Estadisticas";
import Historial from "../views/Historial";
import Configuracion from "../views/Configuracion";
import Login from "../views/Login";

// ─── Auth Context ────────────────────────────────────────────────────────────
interface AuthCtx {
  isAuthenticated: boolean;
  user: { username: string } | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
}
const AuthContext = createContext<AuthCtx | undefined>(undefined);
const ADMIN_USER = import.meta.env.PUBLIC_LUMINA_ADMIN_USER || "admin";
const ADMIN_PASS = import.meta.env.PUBLIC_LUMINA_ADMIN_PASS || "admin123";
const STORAGE_KEY = "lumina_auth";

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { 
      try { 
        setUser(JSON.parse(raw)); 
      } catch (e) { 
        console.error("Error parsing stored auth:", e); 
      } 
    }
    setHydrated(true);
  }, []);

  const login = (username: string, password: string) => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const u = { username };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!hydrated) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

// ─── Theme Context ────────────────────────────────────────────────────────────
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("lumina_theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("lumina_theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === "light" ? "dark" : "light"));

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};

// ─── Router ───────────────────────────────────────────────────────────────────
const RouterContext = createContext<{
  route: Route;
  navigate: (r: Route) => void;
} | undefined>(undefined);

export const useRouter = () => {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be inside RouterProvider");
  return ctx;
};

function RouterProvider({ children }: { children: ReactNode }) {
  const getInitialRoute = (): Route => {
    const hash = window.location.hash.replace("#", "") || "/";
    return hash as Route;
  };

  const [route, setRoute] = useState<Route>("/");

  useEffect(() => {
    setRoute(getInitialRoute());
    const handler = () => setRoute(getInitialRoute());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (r: Route) => {
    window.location.hash = r;
    setRoute(r);
  };

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

// ─── Page Renderer ────────────────────────────────────────────────────────────
function AppInner() {
  const { route, navigate } = useRouter();
  const { isAuthenticated } = useAuth();

  if (route === "/login") return <Login />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const pages: Record<string, ReactNode> = {
    "/": <Dashboard />,
    "/asistencia": <Asistencia />,
    "/empleados": <Empleados />,
    "/descuentos": <Descuentos />,
    "/impuestos": <Impuestos />,
    "/estadisticas": <Estadisticas />,
    "/historial": <Historial />,
    "/configuracion": <Configuracion />,
  };

  return (
    <AppLayout>
      {pages[route] ?? <Dashboard />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <Toaster position="top-right" richColors />
          <AppInner />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
