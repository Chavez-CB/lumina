// Dashboard principal con KPIs, gráficas y feed en tiempo real
import { useEffect, useMemo, useState } from "react";
import {
  Users, UserCheck, UserX, Clock, TrendingUp, AlertTriangle, Calendar,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import KpiCard from "../components/KpiCard";
import { Input } from "../components/ui/input";
import { empleadoService } from "../services/empleadoService";
import { attendanceService } from "../services/attendanceService";
import type { Empleado } from "../services/empleadoService";
import type { Asistencia } from "../services/attendanceService";

const COLORES = {
  primary: "hsl(162 65% 42%)",
  accent: "hsl(345 65% 42%)",
  warning: "hsl(38 92% 50%)",
  muted: "hsl(215 14% 65%)",
};

const fechaHoy = () => new Date().toISOString().slice(0, 10);
const fechaOffset = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
};

export default function Dashboard() {
  const [fecha, setFecha] = useState(fechaHoy());
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar datos del backend
  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      try {
        // Cargar empleados activos y asistencias de los últimos 30 días en paralelo
        const [emps, asists] = await Promise.all([
          empleadoService.getAll({ activo: 1 }),
          attendanceService.getAll({ limite: 2000 }),
        ]);
        if (!cancelado) {
          setEmpleados(emps);
          setAsistencias(asists);
        }
      } catch (err) {
        console.error("[Dashboard] Error cargando datos:", err);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, []);

  const asistenciasDelDia = (f: string) => asistencias.filter(a => a.fecha === f);
  const obtenerEmpleado = (id: string) => empleados.find(e => e.id === id);

  const datos = useMemo(() => {
    const dia = asistenciasDelDia(fecha);
    const presentes = dia.filter(a => a.estado === "puntual" || a.estado === "tardanza").length;
    const ausentes  = dia.filter(a => a.estado === "ausente").length;
    const tardanzas = dia.filter(a => a.estado === "tardanza").length;
    const totalActivos = empleados.length;

    // Gráfica semana
    const semana = Array.from({ length: 7 }).map((_, i) => {
      const f = fechaOffset(6 - i);
      const d = asistenciasDelDia(f);
      return {
        dia: new Date(f + "T12:00:00").toLocaleDateString("es-PE", { weekday: "short" }),
        Puntuales: d.filter(a => a.estado === "puntual").length,
        Tardanzas: d.filter(a => a.estado === "tardanza").length,
        Ausentes:  d.filter(a => a.estado === "ausente").length,
      };
    });

    // Donut hoy
    const dona = [
      { name: "Puntual",     value: dia.filter(a => a.estado === "puntual").length,     color: COLORES.primary },
      { name: "Tardanza",    value: tardanzas,                                           color: COLORES.warning },
      { name: "Ausente",     value: ausentes,                                            color: COLORES.accent  },
      { name: "Justificado", value: dia.filter(a => a.estado === "justificado").length,  color: COLORES.muted   },
    ];

    // Tendencia 30 días
    const tendencia = Array.from({ length: 30 }).map((_, i) => {
      const f = fechaOffset(29 - i);
      const d = asistenciasDelDia(f);
      const total = d.length || 1;
      const pct = (d.filter(a => a.estado === "puntual").length / total) * 100;
      return { fecha: new Date(f + "T12:00:00").getDate().toString(), asistencia: +pct.toFixed(1) };
    });

    // Últimas marcaciones del día
    const recientes = dia
      .filter(a => a.entrada)
      .sort((a, b) => (b.entrada ?? "").localeCompare(a.entrada ?? ""))
      .slice(0, 6);

    // Alertas: empleados que no marcaron entrada hoy
    const horaAhora = new Date().getHours() * 60 + new Date().getMinutes();
    const alertas = empleados.filter(e => {
      const a = dia.find(x => x.empleadoId === e.id);
      if (a?.entrada) return false;
      const [h, m] = e.horarioEntrada.split(":").map(Number);
      return horaAhora > h * 60 + m + 30;
    }).slice(0, 4);

    // Tendencia vs semana anterior
    const presActual = semana.reduce((s, d) => s + d.Puntuales + d.Tardanzas, 0);
    const presAnterior = Array.from({ length: 7 }).map((_, i) => {
      const base = new Date(fecha + "T00:00:00");
      base.setDate(base.getDate() - (13 - i));
      const f = base.toISOString().slice(0, 10);
      return asistenciasDelDia(f).filter(a => a.estado === "puntual" || a.estado === "tardanza").length;
    }).reduce((s, n) => s + n, 0);

    const tendPct = presAnterior > 0
      ? ((presActual - presAnterior) / presAnterior * 100).toFixed(1)
      : null;
    const tendLabel   = tendPct !== null ? `${Number(tendPct) >= 0 ? "+" : ""}${tendPct}% vs semana anterior` : "Sin datos previos";
    const tendPositiva = tendPct === null || Number(tendPct) >= 0;

    return { presentes, ausentes, tardanzas, totalActivos, semana, dona, tendencia, recientes, alertas, tendLabel, tendPositiva };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, empleados, asistencias]);

  if (cargando) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resumen general</h2>
          <p className="text-sm text-muted-foreground">Cargando datos del sistema...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-6 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header con selector de fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resumen general</h2>
          <p className="text-sm text-muted-foreground">Vista en tiempo real del control de asistencia.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-soft">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border-0 h-8 px-1 focus-visible:ring-0 w-auto"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Empleados activos" value={datos.totalActivos} icon={Users} variant="primary" trend={{ value: "Activos", positive: true }} />
        <KpiCard title="Presentes hoy" value={datos.presentes} icon={UserCheck} variant="primary" trend={{ value: `${Math.round((datos.presentes / Math.max(datos.totalActivos, 1)) * 100)}%`, positive: true }} />
        <KpiCard title="Ausentes hoy" value={datos.ausentes} icon={UserX} variant="accent" />
        <KpiCard title="Tardanzas" value={datos.tardanzas} icon={Clock} variant="warning" />
      </div>

      {/* Gráficas principales */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Asistencia de la semana</h3>
              <p className="text-xs text-muted-foreground">Comparativa de los últimos 7 días</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${datos.tendPositiva ? "text-primary" : "text-accent"}`}>
              <TrendingUp className="h-3.5 w-3.5" />
              {datos.tendLabel}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={datos.semana} barCategoryGap={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="Puntuales" fill={COLORES.primary} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Tardanzas" fill={COLORES.warning} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Ausentes"  fill={COLORES.accent}  radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
          <h3 className="font-semibold">Estado de hoy</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribución actual</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={datos.dona} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                {datos.dona.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {datos.dona.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendencia + recientes + alertas */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6 shadow-soft">
          <div className="mb-4">
            <h3 className="font-semibold">Tendencia mensual</h3>
            <p className="text-xs text-muted-foreground">% de puntualidad en los últimos 30 días</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={datos.tendencia}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORES.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORES.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="fecha" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="asistencia" stroke={COLORES.primary} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: COLORES.primary }} fill="url(#grad)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          {/* Marcaciones recientes */}
          <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
            <h3 className="font-semibold mb-1">Últimas marcaciones</h3>
            <p className="text-xs text-muted-foreground mb-4">En tiempo real</p>
            <div className="space-y-3">
              {datos.recientes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin marcaciones aún.</p>
              )}
              {datos.recientes.map(a => {
                const e = obtenerEmpleado(a.empleadoId);
                const nombre = a.nombreEmpleado ?? e?.nombre ?? "Empleado";
                const foto   = a.fotoEmpleado  ?? e?.foto;
                const area   = a.areaEmpleado  ?? e?.area ?? "";
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-base">
                    {foto ? (
                      <img src={foto} alt={nombre} className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary-soft flex items-center justify-center ring-2 ring-primary/20">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{nombre}</p>
                      <p className="text-xs text-muted-foreground">{area}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold">{a.entrada}</p>
                      <p className="text-[10px] uppercase tracking-wider text-primary">Facial</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alertas */}
          <div className="rounded-2xl bg-accent-soft border border-accent/20 p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-semibold text-accent">Alertas del día</h3>
            </div>
            {datos.alertas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas. Todo en orden.</p>
            ) : (
              <div className="space-y-2">
                {datos.alertas.map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="flex-1 truncate">{e.nombre}</span>
                    <span className="text-xs text-muted-foreground">no marcó</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
