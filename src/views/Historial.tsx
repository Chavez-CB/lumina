// Modulo de Historial — registros reales completos
import { useState } from "react";
import { Search, Download, FileText, Pencil, History } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getAsistencias, obtenerEmpleado, empleados } from "../lib/mockData";
import EstadoBadge from "../components/EstadoBadge";
import { historialService } from "../services/historialService";
import { exportarCSV, exportarPDF } from "../lib/exportUtils";

export default function Historial() {
  const [q, setQ] = useState("");
  const [tabActiva, setTabActiva] = useState("asistencia");
  const [year, setYear] = useState(new Date().getFullYear());

  const ordenadas = [...getAsistencias()].sort((a, b) =>
    (b.fecha + (b.entrada ?? "")).localeCompare(a.fecha + (a.entrada ?? ""))
  );

  const filtradas = ordenadas.filter(a => {
    const e = obtenerEmpleado(a.empleadoId);
    return e?.nombre.toLowerCase().includes(q.toLowerCase()) || a.fecha.includes(q);
  }).slice(0, 100);

  const histDesc = historialService.getDescuentosPorMes(year);
  const cambios   = historialService.getCambios();

  // ── Exportar asistencia ──────────────────────────────────────────────────
  const exportAsistenciaCSV = () => {
    const rows = filtradas.map(a => {
      const e = obtenerEmpleado(a.empleadoId);
      return [e?.nombre ?? "", a.fecha, a.entrada ?? "—", a.salida ?? "—", `${a.horasTrabajadas.toFixed(1)}h`, a.estado, "Facial"];
    });
    exportarCSV("historial_asistencia", ["Empleado","Fecha","Entrada","Salida","Horas","Estado","Metodo"], rows);
  };

  const exportAsistenciaPDF = () => {
    const rows = filtradas.map(a => {
      const e = obtenerEmpleado(a.empleadoId);
      return [e?.nombre ?? "", a.fecha, a.entrada ?? "—", a.salida ?? "—", `${a.horasTrabajadas.toFixed(1)}h`, a.estado];
    });
    exportarPDF("Historial de Asistencia", ["Empleado","Fecha","Entrada","Salida","Horas","Estado"], rows);
  };

  // ── Exportar descuentos ──────────────────────────────────────────────────
  const exportDescCSV = () => {
    const rows = histDesc.map(h => [h.mes, h.tardanzas.toString(), h.faltas.toString(), `S/ ${h.monto.toLocaleString()}`]);
    exportarCSV(`descuentos_${year}`, ["Mes","Tardanzas","Faltas","Total descontado"], rows);
  };

  const exportDescPDF = () => {
    const rows = histDesc.map(h => [h.mes, h.tardanzas.toString(), h.faltas.toString(), `S/ ${h.monto.toLocaleString()}`]);
    exportarPDF(`Descuentos por Mes ${year}`, ["Mes","Tardanzas","Faltas","Total descontado"], rows);
  };

  const handleExportCSV = () => tabActiva === "asistencia" ? exportAsistenciaCSV() : exportDescCSV();
  const handleExportPDF = () => tabActiva === "asistencia" ? exportAsistenciaPDF() : exportDescPDF();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historial</h2>
          <p className="text-sm text-muted-foreground">Registro completo e inmutable del sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}><FileText className="h-4 w-4 mr-2" />Exportar PDF</Button>
          <Button className="bg-gradient-primary" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Exportar Excel</Button>
        </div>
      </div>

      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="descuentos">Descuentos</TabsTrigger>
          <TabsTrigger value="cambios">Cambios</TabsTrigger>
        </TabsList>

        {/* Tab: Asistencia */}
        <TabsContent value="asistencia" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por empleado o fecha (yyyy-mm-dd)..." className="pl-9 h-11 bg-card" />
          </div>
          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                  <tr>
                    <th className="text-left p-4 font-semibold">Empleado</th>
                    <th className="text-left p-4 font-semibold">Fecha</th>
                    <th className="text-center p-4 font-semibold">Entrada</th>
                    <th className="text-center p-4 font-semibold">Salida</th>
                    <th className="text-center p-4 font-semibold">Horas</th>
                    <th className="text-center p-4 font-semibold">Estado</th>
                    <th className="text-center p-4 font-semibold">Metodo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(a => {
                    const e = obtenerEmpleado(a.empleadoId);
                    if (!e) return null;
                    return (
                      <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition-base">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={e.foto} alt={e.nombre} className="h-8 w-8 rounded-full object-cover" />
                            <span className="font-medium">{e.nombre}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono">{a.fecha}</td>
                        <td className="p-4 text-center font-mono">{a.entrada ?? "—"}</td>
                        <td className="p-4 text-center font-mono">{a.salida ?? "—"}</td>
                        <td className="p-4 text-center font-mono">{a.horasTrabajadas.toFixed(1)}h</td>
                        <td className="p-4 text-center"><EstadoBadge estado={a.estado} /></td>
                        <td className="p-4 text-center">
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-soft text-primary font-semibold">Facial</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Descuentos */}
        <TabsContent value="descuentos" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Año:</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setYear(y => y - 1)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-base text-sm">‹</button>
              <span className="w-12 text-center font-semibold text-sm">{year}</span>
              <button onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-base text-sm disabled:opacity-40">›</button>
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-4 font-semibold">Mes</th>
                  <th className="text-center p-4 font-semibold">Tardanzas</th>
                  <th className="text-center p-4 font-semibold">Faltas</th>
                  <th className="text-right p-4 font-semibold">Total descontado</th>
                </tr>
              </thead>
              <tbody>
                {histDesc.map(h => (
                  <tr key={h.mes} className="border-t border-border hover:bg-muted/30 transition-base">
                    <td className="p-4 font-medium">{h.mes}</td>
                    <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-semibold">{h.tardanzas}</span></td>
                    <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-semibold">{h.faltas}</span></td>
                    <td className="p-4 text-right font-mono font-bold text-accent">- S/ {h.monto.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab: Cambios */}
        <TabsContent value="cambios" className="mt-4 space-y-3">
          {cambios.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-12 shadow-soft text-center">
              <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="font-semibold text-muted-foreground">Sin cambios registrados</p>
              <p className="text-xs text-muted-foreground mt-1">Los cambios manuales realizados por administradores apareceran aqui.</p>
            </div>
          ) : cambios.map(c => (
            <div key={c.id} className="rounded-2xl bg-card border border-border p-5 shadow-soft flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center"><Pencil className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-semibold">{c.empleado}</p>
                  <span className="text-xs text-muted-foreground font-mono">{c.fecha}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold text-foreground">Motivo:</span> {c.motivo}</p>
                <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Detalle:</span> {c.detalle}</p>
                <p className="text-xs text-muted-foreground mt-2">Realizado por <span className="font-mono font-semibold">{c.autor}</span></p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
