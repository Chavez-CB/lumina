// Modulo de Configuracion del sistema
import { useEffect, useState } from "react";
import { Building2, Clock, BadgePercent, KeyRound, Palette, Save, Plus, Pencil, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useTheme } from "../components/App";
import { toast } from "sonner";
import { configService } from "../services/configService";
import { horarioService } from "../services/horarioService";
import type { Horario } from "../services/horarioService";

const DIAS_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

// ── Formulario de horario ────────────────────────────────────────────────────
function FormularioHorario({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Horario>;
  onSave: (data: Omit<Horario, "id">) => void;
  onCancel: () => void;
}) {
  const [nombre,     setNombre]     = useState(initial?.nombre     ?? "");
  const [entrada,    setEntrada]    = useState(initial?.entrada    ?? "08:00");
  const [salida,     setSalida]     = useState(initial?.salida     ?? "17:00");
  const [tolerancia, setTolerancia] = useState(initial?.toleranciaMinutos?.toString() ?? "10");
  const [dias,       setDias]       = useState<number[]>(initial?.diasLaborables ?? [1,2,3,4,5]);

  const toggleDia = (d: number) =>
    setDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nombre, entrada, salida, toleranciaMinutos: parseInt(tolerancia), diasLaborables: dias });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <Campo label="Nombre del horario" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Turno tarde" required />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Hora entrada" type="time" value={entrada} onChange={e => setEntrada(e.target.value)} required />
        <Campo label="Hora salida"  type="time" value={salida}  onChange={e => setSalida(e.target.value)}  required />
      </div>
      <Campo label="Tolerancia (minutos)" type="number" value={tolerancia} onChange={e => setTolerancia(e.target.value)} min="0" />
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dias laborables</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {DIAS_LABELS.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDia(i)}
              className={`h-9 w-9 rounded-lg text-xs font-semibold transition-base ${
                dias.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {d.slice(0, 1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> Cancelar
        </Button>
        <Button type="submit" className="flex-1 bg-gradient-primary">Guardar</Button>
      </div>
    </form>
  );
}

// ── Vista principal ──────────────────────────────────────────────────────────
export default function Configuracion() {
  const { theme, toggle } = useTheme();
  const cfg = configService.getConfig();

  const [empresa,   setEmpresa]   = useState(cfg.empresa);
  const [descuentos, setDesc]     = useState(cfg.descuentos);
  const [diasLab,   setDiasLab]   = useState<number[]>(cfg.diasLaborables);
  const [cuenta,    setCuenta]    = useState({ passwordActual: "", nuevoUsuario: "", passwordNuevo: "" });
  const [horarios,  setHorarios]  = useState<Horario[]>([]);
  const [openHorario, setOpenHorario] = useState(false);
  const [editandoHorario, setEditandoHorario] = useState<Horario | null>(null);

  useEffect(() => { horarioService.getAll().then(setHorarios); }, []);

  const setE = (k: keyof typeof empresa) => (v: string) => setEmpresa(prev => ({ ...prev, [k]: v }));
  const setD = (k: keyof typeof descuentos) => (v: string) => setDesc(prev => ({ ...prev, [k]: parseFloat(v) || 0 }));

  const toggleDiaLab = (d: number) =>
    setDiasLab(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const guardar = async () => {
    await configService.saveConfig({ empresa, descuentos, diasLaborables: diasLab });
    toast.success("Configuracion guardada", { description: "Los cambios se aplicaron correctamente." });
  };

  const handleCreateHorario = async (data: Omit<Horario, "id">) => {
    await horarioService.create(data);
    horarioService.getAll().then(setHorarios);
    setOpenHorario(false);
  };

  const handleEditHorario = async (data: Omit<Horario, "id">) => {
    if (!editandoHorario) return;
    await horarioService.update(editandoHorario.id, data);
    horarioService.getAll().then(setHorarios);
    setEditandoHorario(null);
  };

  const handleDeleteHorario = async (id: string) => {
    await horarioService.delete(id);
    horarioService.getAll().then(setHorarios);
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuracion</h2>
        <p className="text-sm text-muted-foreground">Personaliza el sistema segun las politicas de tu empresa.</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="bg-card border border-border flex-wrap h-auto">
          <TabsTrigger value="empresa"><Building2  className="h-4 w-4 mr-1.5" />Empresa</TabsTrigger>
          <TabsTrigger value="horarios"><Clock      className="h-4 w-4 mr-1.5" />Horarios</TabsTrigger>
          <TabsTrigger value="politica"><BadgePercent className="h-4 w-4 mr-1.5" />Politica descuentos</TabsTrigger>
          <TabsTrigger value="cuenta"><KeyRound   className="h-4 w-4 mr-1.5" />Cuenta admin</TabsTrigger>
          <TabsTrigger value="apariencia"><Palette className="h-4 w-4 mr-1.5" />Apariencia</TabsTrigger>
        </TabsList>

        {/* Empresa */}
        <TabsContent value="empresa" className="mt-4">
          <Tarjeta titulo="Datos de la empresa">
            <Campo label="Nombre"      value={empresa.nombre}    onChange={e => setE("nombre")(e.target.value)} />
            <Campo label="RUC"         value={empresa.ruc}       onChange={e => setE("ruc")(e.target.value)} />
            <Campo label="Direccion"   value={empresa.direccion} onChange={e => setE("direccion")(e.target.value)} className="md:col-span-2" />
            <Campo label="Logo (URL)"  value={empresa.logo}      onChange={e => setE("logo")(e.target.value)}      placeholder="https://..." className="md:col-span-2" />
          </Tarjeta>
        </TabsContent>

        {/* Horarios */}
        <TabsContent value="horarios" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Horarios laborales</h3>
              <p className="text-xs text-muted-foreground">Define los turnos disponibles para asignar a empleados o areas.</p>
            </div>
            <Button className="bg-gradient-primary" onClick={() => setOpenHorario(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo horario
            </Button>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-soft divide-y divide-border">
            {horarios.map(h => (
              <div key={h.id} className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{h.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.entrada} – {h.salida} · {h.toleranciaMinutos} min tolerancia
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {DIAS_LABELS.map((d, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          h.diasLaborables.includes(i)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {d.slice(0, 1)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditandoHorario(h)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteHorario(h.id)}
                    className="text-accent hover:text-accent hover:bg-accent-soft">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {horarios.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin horarios configurados.</p>
            )}
          </div>
        </TabsContent>

        {/* Politica descuentos */}
        <TabsContent value="politica" className="mt-4">
          <Tarjeta titulo="Descuentos automaticos">
            <Campo label="Monto por tardanza (S/)" type="number"
              value={descuentos.montoTardanza.toString()}
              onChange={e => setD("montoTardanza")(e.target.value)} />
            <Campo label="% del dia por falta injustificada" type="number"
              value={descuentos.porcentajeFalta.toString()}
              onChange={e => setD("porcentajeFalta")(e.target.value)} />
            <Campo label="Tolerancia de puntualidad (minutos)" type="number"
              value={descuentos.toleranciaMinutos.toString()}
              onChange={e => setD("toleranciaMinutos")(e.target.value)} />
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dias laborables globales</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIAS_LABELS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDiaLab(i)}
                    className={`h-10 w-10 rounded-lg font-semibold transition-base ${
                      diasLab.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d.slice(0, 1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 rounded-xl bg-primary-soft p-4 text-sm text-primary border border-primary/20">
              <p className="font-semibold">Ejemplo de calculo</p>
              <p className="text-foreground mt-1">
                Cada tardanza descuenta <strong>S/ {descuentos.montoTardanza}</strong> y cada falta injustificada
                descuenta el <strong>{descuentos.porcentajeFalta}%</strong> del sueldo diario.
              </p>
            </div>
          </Tarjeta>
        </TabsContent>

        {/* Cuenta admin */}
        <TabsContent value="cuenta" className="mt-4">
          <Tarjeta titulo="Credenciales de administrador">
            <Campo label="Contrasena actual" type="password" placeholder="Contrasena actual"
              value={cuenta.passwordActual} onChange={e => setCuenta(c => ({ ...c, passwordActual: e.target.value }))} />
            <Campo label="Nuevo usuario" placeholder="Nuevo nombre de usuario"
              value={cuenta.nuevoUsuario} onChange={e => setCuenta(c => ({ ...c, nuevoUsuario: e.target.value }))} />
            <Campo label="Nueva contrasena" type="password" placeholder="Minimo 8 caracteres"
              value={cuenta.passwordNuevo} onChange={e => setCuenta(c => ({ ...c, passwordNuevo: e.target.value }))} className="md:col-span-2" />
          </Tarjeta>
        </TabsContent>

        {/* Apariencia */}
        <TabsContent value="apariencia" className="mt-4">
          <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
            <h3 className="font-semibold mb-4">Apariencia</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
              <div>
                <p className="font-medium">Modo oscuro</p>
                <p className="text-xs text-muted-foreground">Reduce la fatiga visual en entornos con poca luz.</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={guardar} className="bg-gradient-primary">
          <Save className="h-4 w-4 mr-2" /> Guardar cambios
        </Button>
      </div>

      {/* Modal nuevo horario */}
      <Dialog open={openHorario} onOpenChange={setOpenHorario}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo horario</DialogTitle></DialogHeader>
          <FormularioHorario onSave={handleCreateHorario} onCancel={() => setOpenHorario(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal editar horario */}
      <Dialog open={!!editandoHorario} onOpenChange={() => setEditandoHorario(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar horario</DialogTitle></DialogHeader>
          {editandoHorario && (
            <FormularioHorario
              initial={editandoHorario}
              onSave={handleEditHorario}
              onCancel={() => setEditandoHorario(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
      <h3 className="font-semibold mb-4">{titulo}</h3>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Campo({ label, className = "", ...rest }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input {...rest} className="mt-1.5 h-11" />
    </div>
  );
}
