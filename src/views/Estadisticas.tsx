// Módulo de Estadísticas — análisis visual completo
import { useMemo } from "react";
import { Award, TrendingDown, AlertTriangle, Activity } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { empleados, asistencias, areas, configDescuentos, fechaOffset } from "../lib/mockData";
import KpiCard from "../components/KpiCard";

const C = { primary: "hsl(162 65% 42%)", accent: "hsl(345 65% 42%)", warning: "hsl(38 92% 50%)", muted: "hsl(215 14% 65%)" };

export default function Estadisticas() {
  const data = useMemo(() => {
    // Asistencia diaria 30 días
    const diaria = Array.from({ length: 30 }).map((_, i) => {
      const f = fechaOffset(29 - i);
      const d = asistencias.filter(a => a.fecha === f);
      return {
        d: new Date(f).getDate().toString(),
        Asistencias: d.filter(a => a.estado !== "ausente").length,
        Faltas: d.filter(a => a.estado === "ausente").length,
      };
    });

    // Dona puntualidad mes
    const totalMes = asistencias.length || 1;
    const dona = [
      { name: "Puntual", value: asistencias.filter(a => a.estado === "puntual").length, color: C.primary },
      { name: "Tardanza", value: asistencias.filter(a => a.estado === "tardanza").length, color: C.warning },
      { name: "Ausente", value: asistencias.filter(a => a.estado === "ausente").length, color: C.accent },
      { name: "Justificado", value: asistencias.filter(a => a.estado === "justificado").length, color: C.muted },
    ];
    const pctAsist = ((dona[0].value + dona[1].value) / totalMes * 100).toFixed(1);

    // Evolución mensual (12 meses simulada)
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const evolucion = meses.map((m, i) => ({
      mes: m, asistencia: 80 + Math.round(Math.sin(i / 1.5) * 8 + Math.random() * 5),
    }));

    // Ranking puntuales
    const ranking = empleados.map(e => {
      const a = asistencias.filter(x => x.empleadoId === e.id);
      const p = a.filter(x => x.estado === "puntual").length;
      return { nombre: e.nombre.split(" ")[0] + " " + (e.nombre.split(" ")[1] ?? ""), puntuales: p };
    }).sort((a, b) => b.puntuales - a.puntuales).slice(0, 7);

    // Tardanzas por área
    const porArea = areas.map(ar => {
      const empAr = empleados.filter(e => e.area === ar).map(e => e.id);
      const aAr = asistencias.filter(a => empAr.includes(a.empleadoId));
      return {
        area: ar.length > 12 ? ar.slice(0, 11) + "…" : ar,
        Tardanzas: aAr.filter(a => a.estado === "tardanza").length,
        Faltas: aAr.filter(a => a.estado === "ausente").length,
      };
    });

    // Descuentos por mes (simulado)
    const descMes = meses.map((m, i) => ({
      mes: m, Descuentos: 800 + Math.round(Math.cos(i / 1.7) * 300 + Math.random() * 250),
    }));

    // Más puntual
    const masPuntual = ranking[0];

    // Área con más tardanzas
    const areaTopTard = [...porArea].sort((a, b) => b.Tardanzas - a.Tardanzas)[0];

    // Total descuentos mes
    const tardanzas = asistencias.filter(a => a.estado === "tardanza").length;
    const faltas = asistencias.filter(a => a.estado === "ausente").length;
    const sueldoMedio = empleados.reduce((s, e) => s + e.sueldoBase, 0) / empleados.length;
    const totalDesc = tardanzas * configDescuentos.montoTardanza + faltas * (sueldoMedio / 30);

    return { diaria, dona, pctAsist, evolucion, ranking, porArea, descMes, masPuntual, areaTopTard, totalDesc };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Análisis estadístico</h2>
        <p className="text-sm text-muted-foreground">Visualiza el comportamiento del personal con detalle.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Asistencia general" value={`${data.pctAsist}%`} icon={Activity} variant="primary" trend={{ value: "+2.1%", positive: true }} />
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
