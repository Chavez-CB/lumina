// Módulo de Descuentos — cálculo automático por tardanzas y faltas
import { useEffect, useMemo, useState } from "react";
import { TrendingDown, Clock, UserX, Wallet } from "lucide-react";
import { configDescuentos } from "../lib/mockData";
import { empleadoService } from "../services/empleadoService";
import type { Empleado } from "../services/empleadoService";
import { attendanceService } from "../services/attendanceService";
import type { Asistencia } from "../services/attendanceService";
import KpiCard from "../components/KpiCard";

export default function Descuentos() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsist]   = useState<Asistencia[]>([]);

  useEffect(() => {
    Promise.all([
      empleadoService.getAll({ activo: true }),
      attendanceService.getAll({ limite: 2000 }),
    ]).then(([e, a]) => { setEmpleados(e); setAsist(a); }).catch(console.error);
  }, []);

  const data = useMemo(() => {
    return empleados.map(e => {
      const asist = asistencias.filter(a => a.empleadoId === e.id);
      const tardanzas = asist.filter(a => a.estado === "tardanza").length;
      const faltas = asist.filter(a => a.estado === "ausente").length;
      const sueldoDiario = e.sueldoBase / 30;
      const descTard = tardanzas * configDescuentos.montoTardanza;
      const descFalta = faltas * sueldoDiario * (configDescuentos.porcentajeFalta / 100);
      const subtotal = e.sueldoBase - descTard - descFalta;
      return { e, tardanzas, faltas, descTard, descFalta, subtotal };
    });
  }, [empleados, asistencias]);

  const totalTard = data.reduce((s, d) => s + d.descTard, 0);
  const totalFalta = data.reduce((s, d) => s + d.descFalta, 0);
  const totalDesc = totalTard + totalFalta;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Descuentos por asistencia</h2>
        <p className="text-sm text-muted-foreground">Cálculo automático mensual según política configurada.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total descontado" value={`S/ ${totalDesc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={TrendingDown} variant="accent" />
        <KpiCard title="Por tardanzas" value={`S/ ${totalTard.toLocaleString()}`} icon={Clock} variant="warning" />
        <KpiCard title="Por faltas" value={`S/ ${totalFalta.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={UserX} variant="accent" />
        <KpiCard title="Tolerancia" value={`${configDescuentos.toleranciaMinutos} min`} icon={Wallet} variant="primary" />
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Detalle por empleado</h3>
            <p className="text-xs text-muted-foreground">S/ {configDescuentos.montoTardanza} por tardanza · {configDescuentos.porcentajeFalta}% del día por falta injustificada</p>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-4 font-semibold">Empleado</th>
                <th className="text-right p-4 font-semibold">Sueldo base</th>
                <th className="text-center p-4 font-semibold">Tardanzas</th>
                <th className="text-center p-4 font-semibold">Faltas</th>
                <th className="text-right p-4 font-semibold">Desc. tardanza</th>
                <th className="text-right p-4 font-semibold">Desc. faltas</th>
                <th className="text-right p-4 font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ e, tardanzas, faltas, descTard, descFalta, subtotal }) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/30 transition-base">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={e.foto} alt={e.nombre} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <p className="font-medium">{e.nombre}</p>
                        <p className="text-xs text-muted-foreground">{e.area}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono">S/ {e.sueldoBase.toLocaleString()}</td>
                  <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-semibold">{tardanzas}</span></td>
                  <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-semibold">{faltas}</span></td>
                  <td className="p-4 text-right font-mono text-warning">- S/ {descTard.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-accent">- S/ {descFalta.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="p-4 text-right font-mono font-bold text-primary">S/ {subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
