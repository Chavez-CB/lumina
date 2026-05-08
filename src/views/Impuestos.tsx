// Modulo de Impuestos — gestion y calculo de nomina neta
import { useEffect, useMemo, useState } from "react";
import { Plus, Receipt, Pencil, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { configDescuentos } from "../lib/mockData";
import type { Impuesto } from "../lib/mockData";
import { impuestoService } from "../services/impuestoService";
import { empleadoService } from "../services/empleadoService";
import type { Empleado } from "../services/empleadoService";
import { attendanceService } from "../services/attendanceService";
import type { Asistencia } from "../services/attendanceService";

// ── Formulario compartido (crear y editar) ──────────────────────────────────
interface FormData {
  nombre: string;
  tipo: "deduccion" | "aporte";
  porcentaje: string;
}

function FormularioImpuesto({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Impuesto>;
  onSave: (data: Omit<Impuesto, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    nombre:     initial?.nombre     ?? "",
    tipo:       initial?.tipo       ?? "deduccion",
    porcentaje: initial?.porcentaje?.toString() ?? "",
  });

  const set = (k: keyof FormData) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(form.porcentaje);
    if (!form.nombre.trim() || isNaN(pct) || pct < 0 || pct > 100) return;
    onSave({
      nombre:      form.nombre.trim(),
      tipo:        form.tipo,
      porcentaje:  pct,
      activo:      initial?.activo      ?? true,
      aplicaTodos: initial?.aplicaTodos ?? true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nombre
        </Label>
        <Input
          value={form.nombre}
          onChange={e => set("nombre")(e.target.value)}
          placeholder="Ej: AFP Integra"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Estado
        </Label>
        <Select value={form.tipo} onValueChange={v => set("tipo")(v)}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deduccion">Deduccion — se descuenta del sueldo</SelectItem>
            <SelectItem value="aporte">Aporte empresa — lo paga la empresa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Porcentaje (%)
        </Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={form.porcentaje}
          onChange={e => set("porcentaje")(e.target.value)}
          placeholder="Ej: 13"
          required
          className="h-11"
        />
        {form.porcentaje && (
          <p className="text-xs text-muted-foreground">
            Se {form.tipo === "deduccion" ? "descontara" : "aportara"} el{" "}
            <strong>{form.porcentaje}%</strong> del subtotal.
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> Cancelar
        </Button>
        <Button type="submit" className="flex-1 bg-gradient-primary">
          Guardar
        </Button>
      </div>
    </form>
  );
}

// ── Vista principal ──────────────────────────────────────────────────────────
export default function Impuestos() {
  const [imps, setImps]             = useState<Impuesto[]>(impuestoService.getAll());
  const [empleados, setEmpleados]   = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [empleadoId, setEmpleadoId] = useState<string>("");
  const [openNuevo, setOpenNuevo]   = useState(false);
  const [editando, setEditando]     = useState<Impuesto | null>(null);

  useEffect(() => {
    Promise.all([
      empleadoService.getAll({ activo: 1 }),
      attendanceService.getAll({ limite: 2000 }),
    ]).then(([e, a]) => {
      setEmpleados(e);
      setAsistencias(a);
      if (e.length > 0) setEmpleadoId(e[0].id);
    }).catch(console.error);
  }, []);

  const empleado = empleados.find(e => e.id === empleadoId);

  const calculo = useMemo(() => {
    if (!empleado) return null;
    const asist = asistencias.filter(a => a.empleadoId === empleadoId);
    const tardanzas  = asist.filter(a => a.estado === "tardanza").length;
    const faltas     = asist.filter(a => a.estado === "ausente").length;
    const sueldoDiario = empleado.sueldoBase / 30;
    const descTard   = tardanzas * configDescuentos.montoTardanza;
    const descFalta  = faltas * sueldoDiario * (configDescuentos.porcentajeFalta / 100);
    const subtotal   = empleado.sueldoBase - descTard - descFalta;

    const aplicados = imps
      .filter(i => i.activo && i.tipo === "deduccion")
      .map(i => ({ ...i, monto: subtotal * (i.porcentaje / 100) }));
    const totalImp = aplicados.reduce((s, x) => s + x.monto, 0);
    const neto     = subtotal - totalImp;

    return { tardanzas, faltas, descTard, descFalta, subtotal, aplicados, totalImp, neto };
  }, [empleado, empleadoId, imps, asistencias]);

  const handleToggle = async (id: string) => {
    await impuestoService.toggleActivo(id);
    setImps(impuestoService.getAll());
  };

  const handleCreate = async (data: Omit<Impuesto, "id">) => {
    await impuestoService.create(data);
    setImps(impuestoService.getAll());
    setOpenNuevo(false);
  };

  const handleEdit = async (data: Omit<Impuesto, "id">) => {
    if (!editando) return;
    await impuestoService.update(editando.id, data);
    setImps(impuestoService.getAll());
    setEditando(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Impuestos y nomina</h2>
          <p className="text-sm text-muted-foreground">Gestion personalizable de deducciones y aportes.</p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => setOpenNuevo(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo impuesto
        </Button>
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
                      {i.tipo === "deduccion" ? "Deduccion" : "Aporte empresa"}
                    </span>
                    {i.aplicaTodos && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Todos
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{i.porcentaje}% del subtotal</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditando(i)}
                  title="Editar impuesto"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Switch checked={i.activo} onCheckedChange={() => handleToggle(i.id)} />
              </div>
            ))}
          </div>
        </div>

        {/* Calculo de nomina */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-soft p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Calcular nomina</h3>
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
            {(!empleado || !calculo) ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando datos...</p>
            ) : (<>
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
            </>)}
          </div>
        </div>
      </div>

      {/* Modal nuevo impuesto */}
      <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo impuesto</DialogTitle>
          </DialogHeader>
          <FormularioImpuesto onSave={handleCreate} onCancel={() => setOpenNuevo(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal editar impuesto */}
      <Dialog open={!!editando} onOpenChange={() => setEditando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar impuesto</DialogTitle>
          </DialogHeader>
          {editando && (
            <FormularioImpuesto
              initial={editando}
              onSave={handleEdit}
              onCancel={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>
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
