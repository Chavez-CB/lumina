// Modulo de Estadisticas — analisis visual completo
import { useEffect, useMemo, useState } from "react";
import { Award, TrendingDown, AlertTriangle, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { estadisticaService } from "../services/estadisticaService";
import type { RankingEmpleado, ResumenMensual } from "../services/estadisticaService";
import { attendanceService } from "../services/attendanceService";
import type { Asistencia } from "../services/attendanceService";
import { empleadoService } from "../services/empleadoService";
import type { Empleado } from "../services/empleadoService";
import KpiCard from "../components/KpiCard";

const AREAS = ["Ventas", "Tecnologia", "Finanzas", "Recursos Humanos", "Marketing", "Logistica", "Administracion"];

const C = { primary: "hsl(162 65% 42%)", accent: "hsl(345 65% 42%)", warning: "hsl(38 92% 50%)", muted: "hsl(215 14% 65%)" };

export default function Estadisticas() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [asistencias, setAsist] = useState<Asistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [ranking, setRanking] = useState<RankingEmpleado[]>([]);
  const [evolucion, setEvolucion] = useState<{ mes: string; asistencia: number }[]>([]);
  const [descMes, setDescMes] = useState<{ mes: string; Descuentos: number }[]>([]);
  const [resumen, setResumen] = useState<ResumenMensual | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    Promise.all([
      attendanceService.getAll({ limite: 2000 }),
      empleadoService.getAll({ activo: true }),
      estadisticaService.getRankingAsistencia(),
      estadisticaService.getEvolucionAnual(year),
      estadisticaService.getDescuentosPorMes(year),
      estadisticaService.getResumenMensual().catch(() => null),
    ]).then(([a, e, r, ev, dm, res]) => {
      setAsist(a); setEmpleados(e); setRanking(r); setEvolucion(ev); setDescMes(dm);
      if (res) setResumen(res);
      setCargando(false);
    }).catch(() => setCargando(false));
  }, [year]);

  const data = useMemo(() => {
    // Asistencia diaria 30 dias
    const diaria = Array.from({ length: 30 }).map((_, i) => {
      const f = (() => { const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toISOString().slice(0, 10); })();
      const d = asistencias.filter(a => a.fecha === f);
      return {
        d: new Date(f + "T12:00:00").getDate().toString(),
        Asistencias: d.filter(a => a.estado !== "ausente").length,
        Faltas: d.filter(a => a.estado === "ausente").length,
      };
    });

    // Dona puntualidad mes
    const totalMes = asistencias.length || 1;
    const dona = [
      { name: "Puntual",     value: asistencias.filter(a => a.estado === "puntual").length,     color: C.primary  },
      { name: "Tardanza",    value: asistencias.filter(a => a.estado === "tardanza").length,    color: C.warning  },
      { name: "Ausente",     value: asistencias.filter(a => a.estado === "ausente").length,     color: C.accent   },
      { name: "Justificado", value: asistencias.filter(a => a.estado === "justificado").length, color: C.muted    },
    ];
    // Preferir pct_asistencia del backend si está disponible
    const pctAsist = resumen
      ? resumen.pct_asistencia.toFixed(1)
      : ((dona[0].value + dona[1].value) / totalMes * 100).toFixed(1);

    // Ranking (del backend)
    const rankingFmt = ranking.slice(0, 7).map(r => ({
      nombre: r.nombre.split(" ").slice(0, 2).join(" "),
      puntuales: r.puntuales,
    }));

    // Tardanzas por area usando empleados del backend
    const porArea = AREAS.map(ar => {
      const empIds = empleados.filter(e => e.area === ar).map(e => e.id);
      const aAr = asistencias.filter(a => empIds.includes(a.empleadoId));
      return {
        area: ar.length > 12 ? ar.slice(0, 11) + "..." : ar,
        Tardanzas: aAr.filter(a => a.estado === "tardanza").length,
        Faltas:    aAr.filter(a => a.estado === "ausente").length,
      };
    });

    const masPuntual  = rankingFmt[0];
    const areaTopTard = [...porArea].sort((a, b) => b.Tardanzas - a.Tardanzas)[0];
    // Preferir total_descuentos_mes del backend si está disponible
    const totalDesc = resumen
      ? resumen.total_descuentos_mes
      : asistencias.filter(a => a.estado === "tardanza").length * 15
        + asistencias.filter(a => a.estado === "ausente").length * (3500 / 30);

    return { diaria, dona, pctAsist, evolucion, ranking: rankingFmt, porArea, descMes, masPuntual, areaTopTard, totalDesc };
  }, [year, asistencias, empleados, ranking, evolucion, descMes, resumen]);

  if (cargando) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analisis estadistico</h2>
          <p className="text-sm text-muted-foreground">Cargando métricas del sistema...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-6 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analisis estadistico</h2>
          <p className="text-sm text-muted-foreground">Visualiza el comportamiento del personal con detalle.</p>
        </div>
        {/* Selector de año */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-soft">
          <button onClick={() => setYear(y => y - 1)} className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-base">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold w-12 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()} className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-base disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Asistencia general" value={`${data.pctAsist}%`} icon={Activity} variant="primary"
          trend={resumen ? { value: `${resumen.presentes_hoy} hoy`, positive: true } : undefined} />
        <KpiCard title="Más puntual" value={data.masPuntual?.nombre ?? "—"} icon={Award} variant="primary" />
        <KpiCard title="Área con más tardanzas" value={data.areaTopTard?.area ?? "—"} icon={AlertTriangle} variant="warning" />
        <KpiCard title="Descuentos del mes" value={`S/ ${Math.round(data.totalDesc).toLocaleString()}`} icon={TrendingDown} variant="accent" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Asistencia diaria" subtitle="Últimos 30 días">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.diaria}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="Asistencias" stackId="a" fill={C.primary} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Faltas" stackId="a" fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribución del mes" subtitle="Estado general de marcaciones">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.dona} innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                {data.dona.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Evolución anual" subtitle="% de asistencia mes a mes">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.evolucion}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={tip} />
              <Line type="monotone" dataKey="asistencia" stroke={C.primary} strokeWidth={3} dot={{ r: 4, fill: C.primary }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Ranking puntualidad" subtitle="Top empleados del mes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.ranking} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="nombre" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={tip} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="puntuales" fill={C.primary} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Comparativa por áreas" subtitle="Tardanzas y faltas">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porArea}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="area" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Tardanzas" stackId="a" fill={C.warning} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Faltas" stackId="a" fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Descuentos mensuales" subtitle="Evolución del año">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.descMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="Descuentos" fill={C.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

const tip = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
