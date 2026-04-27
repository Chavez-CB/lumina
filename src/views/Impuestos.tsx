// Módulo de Impuestos — gestión y cálculo de nómina neta
import { useMemo, useState } from "react";
import { Plus, Receipt, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { empleados, asistencias, configDescuentos, impuestos as mockImp } from "../lib/mockData";
import type { Impuesto } from "../lib/mockData";

export default function Impuestos() {
  const [imps, setImps] = useState<Impuesto[]>(mockImp);
  const [empleadoId, setEmpleadoId] = useState(empleados[0].id);

  const empleado = empleados.find(e => e.id === empleadoId)!;

  const calculo = useMemo(() => {
    const asist = asistencias.filter(a => a.empleadoId === empleadoId);
    const tardanzas = asist.filter(a => a.estado === "tardanza").length;
    const faltas = asist.filter(a => a.estado === "ausente").length;
    const sueldoDiario = empleado.sueldoBase / 30;
    const descTard = tardanzas * configDescuentos.montoTardanza;
    const descFalta = faltas * sueldoDiario * (configDescuentos.porcentajeFalta / 100);
    const subtotal = empleado.sueldoBase - descTard - descFalta;

    const aplicados = imps.filter(i => i.activo && i.tipo === "deduccion").map(i => ({
      ...i,
      monto: subtotal * (i.porcentaje / 100),
    }));
    const totalImp = aplicados.reduce((s, x) => s + x.monto, 0);
    const neto = subtotal - totalImp;

    return { tardanzas, faltas, descTard, descFalta, subtotal, aplicados, totalImp, neto };
  }, [empleado, empleadoId, imps]);

  const toggleImp = (id: string) => setImps(arr => arr.map(i => i.id === id ? { ...i, activo: !i.activo } : i));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Impuestos y nómina</h2>
          <p className="text-sm text-muted-foreground">Gestión personalizable de deducciones y aportes.</p>
        </div>
        <Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-2" />Nuevo impuesto</Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Lista de impuestos */}
        <div className="lg:col-span-3 rounded-2xl bg-card border border-border shadow-soft">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold">Impuestos configurados</h3>
            <p className="text-xs text-muted-foreground">Activa o desactiva sin eliminar.</p>
          </div>
          <div className="divide-y divide-border">
            {imps.map(i => (
              <div key={i.id} className="p-4 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${i.activo ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{i.nombre}</p>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${i.tipo === "deduccion" ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary"}`}>
                      {i.tipo === "deduccion" ? "Deducción" : "Aporte empresa"}
                    </span>
                    {i.aplicaTodos && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Todos</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{i.porcentaje}% del subtotal</p>
                </div>
                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                <Switch checked={i.activo} onCheckedChange={() => toggleImp(i.id)} />
              </div>
            ))}
          </div>
        </div>

        {/* Cálculo de nómina */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-soft p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Calcular nómina</h3>
            <p className="text-xs text-muted-foreground mb-3">Selecciona un empleado.</p>
            <select
              value={empleadoId}
              onChange={e => setEmpleadoId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-2 pt-3 border-t border-border text-sm">
            <Linea label="Sueldo bruto" value={`S/ ${empleado.sueldoBase.toLocaleString()}`} />
            <Linea label={`Tardanzas (${calculo.tardanzas})`} value={`- S/ ${calculo.descTard.toLocaleString()}`} negative />
            <Linea label={`Faltas (${calculo.faltas})`} value={`- S/ ${calculo.descFalta.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} negative />
            <div className="border-t border-dashed border-border pt-2">
              <Linea label="Subtotal" value={`S/ ${calculo.subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} bold />
            </div>
            {calculo.aplicados.map(i => (
              <Linea key={i.id} label={`${i.nombre} (${i.porcentaje}%)`} value={`- S/ ${i.monto.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} negative />
            ))}
            <div className="border-t border-border pt-3 mt-3">
              <div className="rounded-xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
                <p className="text-xs uppercase tracking-wider opacity-90">Sueldo neto a pagar</p>
                <p className="text-3xl font-bold mt-1">S/ {calculo.neto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Linea({ label, value, negative, bold }: { label: string; value: string; negative?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-muted-foreground ${bold ? "font-semibold text-foreground" : ""}`}>{label}</span>
      <span className={`font-mono ${negative ? "text-accent" : ""} ${bold ? "font-bold text-foreground" : ""}`}>{value}</span>
    </div>
  );
}
