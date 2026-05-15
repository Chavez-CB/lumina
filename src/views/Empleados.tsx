// Modulo de Empleados — listado, filtros, ficha, editar, historial
import { useEffect, useState } from "react";
import { Search, UserPlus, Mail, Briefcase, Building2, Calendar, Camera, X, Clock, Pencil, History, Download, CameraOff, Loader2, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import EstadoBadge from "../components/EstadoBadge";
import { empleadoService } from "../services/empleadoService";
import type { Empleado } from "../services/empleadoService";
import { horarioService } from "../services/horarioService";
import type { Horario } from "../services/horarioService";
import { attendanceService } from "../services/attendanceService";
import type { Asistencia } from "../services/attendanceService";
import { exportarCSV } from "../lib/exportUtils";
import { useFotoCaptura } from "../hooks/useFotoCaptura";
import { empleadoFotoService } from "../services/empleadoFotoService";

// Áreas disponibles — se puede mover al backend en el futuro
const areas = ["Ventas", "Tecnologia", "Finanzas", "Recursos Humanos", "Marketing", "Logistica", "Administracion"];

// ── Vista principal ──────────────────────────────────────────────────────────
export default function Empleados() {
  const [lista, setLista] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    empleadoService.getAll().then(emps => {
      setLista(emps);
      setCargando(false);
    }).catch(() => setCargando(false));
  }, []);
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("todas");
  const [seleccionado, setSeleccionado] = useState<Empleado | null>(null);
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [verHistorial, setVerHistorial] = useState<Empleado | null>(null);

  const filtrados = lista.filter(e =>
    (area === "todas" || e.area === area) &&
    (e.nombre.toLowerCase().includes(q.toLowerCase()) || e.dni.includes(q) || e.cargo.toLowerCase().includes(q.toLowerCase()))
  );

  const refresh = async () => { const emps = await empleadoService.getAll(); setLista(emps); };

  const handleCreate = async (data: Omit<Empleado, "id">) => {
    await empleadoService.create(data);
    await refresh();
    setOpenNuevo(false);
  };

  const handleEdit = async (data: Partial<Omit<Empleado, "id">>) => {
    if (!editando) return;
    await empleadoService.update(editando.id, data);
    await refresh();
    setEditando(null);
  };

  if (cargando) return (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold tracking-tight">Personal</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="rounded-2xl bg-card border border-border h-44 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personal</h2>
          <p className="text-sm text-muted-foreground">{lista.length} empleados registrados en la organizacion.</p>
        </div>
        <Button onClick={() => setOpenNuevo(true)} className="bg-gradient-primary"><UserPlus className="h-4 w-4 mr-2" />Nuevo empleado</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, DNI o cargo..." className="pl-9 h-11 bg-card" />
        </div>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-full sm:w-56 h-11 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las areas</SelectItem>
            {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtrados.map(e => (
          <button key={e.id} onClick={() => setSeleccionado(e)}
            className="text-left rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-smooth group">
            <div className="flex items-start gap-3">
              <div className="relative">
                <img src={e.foto} alt={e.nombre} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-base" />
                <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card ${e.activo ? "bg-primary" : "bg-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight truncate">{e.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.cargo}</p>
                <span className="inline-block mt-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-soft text-primary font-semibold">{e.area}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-muted-foreground">DNI</p><p className="font-mono font-medium">{e.dni}</p></div>
              <div><p className="text-muted-foreground">Sueldo</p><p className="font-semibold text-primary">S/ {e.sueldoBase.toLocaleString()}</p></div>
            </div>
          </button>
        ))}
      </div>

      {/* Ficha del empleado */}
      <Dialog open={!!seleccionado} onOpenChange={() => setSeleccionado(null)}>
        <DialogContent className="max-w-2xl">
          {seleccionado && (
            <FichaEmpleado
              emp={seleccionado}
              onEditar={() => { setEditando(seleccionado); setSeleccionado(null); }}
              onHistorial={() => { setVerHistorial(seleccionado); setSeleccionado(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editando} onOpenChange={() => setEditando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar empleado</DialogTitle></DialogHeader>
          {editando && <FormularioEditar emp={editando} onSave={handleEdit} onClose={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>

      {/* Modal historial del empleado */}
      <Dialog open={!!verHistorial} onOpenChange={() => setVerHistorial(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Historial de asistencia</DialogTitle></DialogHeader>
          {verHistorial && <HistorialEmpleado emp={verHistorial} />}
        </DialogContent>
      </Dialog>

      {/* Modal nuevo */}
      <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar nuevo empleado</DialogTitle></DialogHeader>
          <FormularioNuevo onSave={handleCreate} onClose={() => setOpenNuevo(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Ficha de empleado ────────────────────────────────────────────────────────
function FichaEmpleado({ emp, onEditar, onHistorial }: { emp: Empleado; onEditar: () => void; onHistorial: () => void }) {
  const [asist, setAsist] = useState<Asistencia[]>([]);
  const [horario, setHorario] = useState<Horario | undefined>();

  useEffect(() => {
    attendanceService.getAll().then(all => setAsist(all.filter(a => a.empleadoId === emp.id)));
    if (emp.horarioId) horarioService.getById(emp.horarioId).then(setHorario);
  }, [emp.id, emp.horarioId]);

  const puntuales = asist.filter(a => a.estado === "puntual").length;
  const tardanzas = asist.filter(a => a.estado === "tardanza").length;
  const ausentes  = asist.filter(a => a.estado === "ausente").length;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-primary -m-6 mb-0 p-6 rounded-t-2xl text-primary-foreground">
        <div className="flex items-center gap-4">
          <img src={emp.foto} alt={emp.nombre} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30" />
          <div>
            <h3 className="text-xl font-bold">{emp.nombre}</h3>
            <p className="opacity-90 text-sm">{emp.cargo}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">{emp.area}</span>
              {!emp.activo && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20">Inactivo</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info icon={Mail}      label="DNI"         value={emp.dni} />
        <Info icon={Briefcase} label="Sueldo base" value={`S/ ${emp.sueldoBase.toLocaleString()}`} />
        <Info icon={Clock}     label="Horario"     value={horario?.nombre ?? `${emp.horarioEntrada} – ${emp.horarioSalida}`} />
        <Info icon={Building2} label="Turno"       value={`${emp.horarioEntrada} – ${emp.horarioSalida}`} />
        <Info icon={Calendar}  label="Ingreso"     value={new Date(emp.fechaIngreso).toLocaleDateString("es-PE")} className="col-span-2" />
      </div>

      <div className="rounded-xl bg-muted/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Resumen del mes (30 dias)</p>
        <div className="grid grid-cols-3 gap-3">
          <Stat valor={puntuales} label="Puntuales" color="text-primary" />
          <Stat valor={tardanzas} label="Tardanzas" color="text-warning" />
          <Stat valor={ausentes}  label="Ausentes"  color="text-accent" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onEditar}><Pencil className="h-4 w-4 mr-2" />Editar</Button>
        <Button className="flex-1 bg-gradient-primary" onClick={onHistorial}><History className="h-4 w-4 mr-2" />Ver historial</Button>
      </div>
    </div>
  );
}

// ── Historial del empleado ───────────────────────────────────────────────────
function HistorialEmpleado({ emp }: { emp: Empleado }) {
  const [asist, setAsist] = useState<Asistencia[]>([]);

  useEffect(() => {
    attendanceService.getAll()
      .then(all => setAsist([...all.filter(a => a.empleadoId === emp.id)].sort((a, b) => b.fecha.localeCompare(a.fecha))));
  }, [emp.id]);

  const puntual  = asist.filter(a => a.estado === "puntual").length;
  const tardanza = asist.filter(a => a.estado === "tardanza").length;
  const ausente  = asist.filter(a => a.estado === "ausente").length;

  const handleExport = () => {
    const rows = asist.map(a => [a.fecha, a.entrada ?? "—", a.salida ?? "—", `${a.horasTrabajadas.toFixed(1)}h`, a.estado]);
    exportarCSV(`historial_${emp.nombre.replace(/ /g, "_")}`, ["Fecha","Entrada","Salida","Horas","Estado"], rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={emp.foto} alt={emp.nombre} className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="font-semibold">{emp.nombre}</p>
            <p className="text-xs text-muted-foreground">{emp.cargo} · {emp.area}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />CSV</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-primary-soft p-3 text-center"><p className="text-2xl font-bold text-primary">{puntual}</p><p className="text-xs text-muted-foreground">Puntuales</p></div>
        <div className="rounded-xl bg-warning/10 p-3 text-center"><p className="text-2xl font-bold text-warning">{tardanza}</p><p className="text-xs text-muted-foreground">Tardanzas</p></div>
        <div className="rounded-xl bg-accent-soft p-3 text-center"><p className="text-2xl font-bold text-accent">{ausente}</p><p className="text-xs text-muted-foreground">Ausentes</p></div>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden max-h-72 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
            <tr>
              <th className="text-left p-3 font-semibold">Fecha</th>
              <th className="text-center p-3 font-semibold">Entrada</th>
              <th className="text-center p-3 font-semibold">Salida</th>
              <th className="text-center p-3 font-semibold">Horas</th>
              <th className="text-center p-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {asist.map(a => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition-base">
                <td className="p-3 font-mono">{a.fecha}</td>
                <td className="p-3 text-center font-mono">{a.entrada ?? "—"}</td>
                <td className="p-3 text-center font-mono">{a.salida ?? "—"}</td>
                <td className="p-3 text-center font-mono">{a.horasTrabajadas.toFixed(1)}h</td>
                <td className="p-3 text-center"><EstadoBadge estado={a.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Formulario editar ────────────────────────────────────────────────────────
function FormularioEditar({ emp, onSave, onClose }: { emp: Empleado; onSave: (d: Partial<Omit<Empleado,"id">>) => void; onClose: () => void }) {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  useEffect(() => { horarioService.getAll().then(setHorarios); }, []);
  const [nombre, setNombre]   = useState(emp.nombre);
  const [cargo, setCargo]     = useState(emp.cargo);
  const [area, setArea]       = useState(emp.area);
  const [sueldo, setSueldo]   = useState(emp.sueldoBase.toString());
  const [horarioId, setHorId] = useState(emp.horarioId);
  const [activo, setActivo]   = useState(emp.activo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = horarios.find(x => x.id === horarioId);
    onSave({
      nombre, cargo, area, activo,
      sueldoBase: parseFloat(sueldo) || emp.sueldoBase,
      horarioId,
      horarioEntrada: h?.entrada ?? emp.horarioEntrada,
      horarioSalida:  h?.salida  ?? emp.horarioSalida,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-xs font-medium">Nombre completo</label><Input value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
        <div><label className="text-xs font-medium">Cargo</label><Input value={cargo} onChange={e => setCargo(e.target.value)} required /></div>
        <div><label className="text-xs font-medium">Area</label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><label className="text-xs font-medium">Sueldo base</label><Input type="number" value={sueldo} onChange={e => setSueldo(e.target.value)} required /></div>
        <div><label className="text-xs font-medium">Horario asignado</label>
          <Select value={horarioId} onValueChange={setHorId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{horarios.map(h => <SelectItem key={h.id} value={h.id}>{h.nombre} ({h.entrada}–{h.salida})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-muted/40">
          <div><p className="text-sm font-medium">Empleado activo</p><p className="text-xs text-muted-foreground">Desactiva para ocultar sin eliminar</p></div>
          <Switch checked={activo} onCheckedChange={setActivo} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancelar</Button>
        <Button type="submit" className="flex-1 bg-gradient-primary">Guardar cambios</Button>
      </div>
    </form>
  );
}

// ── Formulario nuevo ─────────────────────────────────────────────────────────
function FormularioNuevo({ onSave, onClose }: { onSave: (d: Omit<Empleado,"id">) => void; onClose: () => void }) {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  useEffect(() => { horarioService.getAll().then(setHorarios); }, []);
  const { state: fotoState, videoRef, activarCamara, capturarFoto, reiniciar } = useFotoCaptura();
  const [subiendo, setSubiendo] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const horId = fd.get("horario") as string;
    const h = horarios.find(x => x.id === horId);

    // La foto puede ser la capturada con la camara o el placeholder si no se capturo
    const fotoUrl = fotoState.previewUrl ?? `https://i.pravatar.cc/150?u=${Date.now()}`;

    const nuevoEmpleado: Omit<Empleado, "id"> = {
      nombre:         fd.get("nombre") as string,
      dni:            fd.get("dni") as string,
      cargo:          fd.get("cargo") as string,
      area:           fd.get("area") as string,
      sueldoBase:     parseFloat(fd.get("sueldo") as string) || 0,
      fechaIngreso:   fd.get("ingreso") as string,
      horarioId:      horId,
      horarioEntrada: h?.entrada ?? "08:00",
      horarioSalida:  h?.salida  ?? "17:00",
      foto:           fotoUrl,
      activo:         true,
    };

    // Registrar empleado y subir foto facial si fue capturada
    const creado = await empleadoService.create(nuevoEmpleado);
    if (fotoState.fotoCaptada) {
      setSubiendo(true);
      await empleadoFotoService.subirFoto(creado.id, fotoState.fotoCaptada);
      setSubiendo(false);
    }
    onSave(nuevoEmpleado); // notificar al padre para refrescar lista
  };

  const capturado = fotoState.estado === "capturada";
  const activa    = fotoState.estado === "activa";
  const iniciando = fotoState.estado === "iniciando";

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>

      {/* ── Zona de foto facial ── */}
      <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
        {capturado && fotoState.previewUrl ? (
          /* Foto capturada */
          <div className="relative">
            <img
              src={fotoState.previewUrl}
              alt="Foto capturada"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow">
              <CheckCircle2 className="h-3.5 w-3.5" /> Foto capturada
            </div>
            <button
              type="button"
              onClick={reiniciar}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-foreground/60 backdrop-blur-sm text-background flex items-center justify-center hover:bg-foreground/80 transition-base"
              title="Tomar otra foto"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Camara activa o inactiva */
          <div className="relative aspect-[4/3] bg-foreground">
            <video
              ref={videoRef}
              autoPlay muted playsInline
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            {!activa && !iniciando && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-background">
                <CameraOff className="h-10 w-10 opacity-40" />
                <p className="text-sm opacity-70">Foto para reconocimiento facial</p>
                {fotoState.error && (
                  <p className="text-xs text-accent font-medium px-3 text-center">{fotoState.error}</p>
                )}
              </div>
            )}
            {iniciando && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}
            {activa && (
              <>
                <div className="absolute inset-10 border-2 border-dashed border-primary/70 rounded-3xl animate-pulse-ring" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-foreground/70 backdrop-blur-md text-background text-xs font-medium flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Encuadra el rostro
                </div>
              </>
            )}
          </div>
        )}

        {/* Controles de camara */}
        <div className="flex gap-2 p-3 bg-card border-t border-border">
          {!activa && !capturado && (
            <button
              type="button"
              onClick={activarCamara}
              disabled={iniciando}
              className="flex-1 h-9 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-base disabled:opacity-60"
            >
              {iniciando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {iniciando ? "Iniciando..." : "Activar camara"}
            </button>
          )}
          {activa && (
            <button
              type="button"
              onClick={capturarFoto}
              className="flex-1 h-9 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-base"
            >
              <Camera className="h-3.5 w-3.5" /> Capturar foto
            </button>
          )}
          {capturado && (
            <button
              type="button"
              onClick={reiniciar}
              className="flex-1 h-9 rounded-lg border border-border hover:bg-muted/50 text-xs font-medium flex items-center justify-center gap-2 transition-base"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Repetir
            </button>
          )}
        </div>
      </div>

      {/* ── Campos del formulario ── */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium">Nombre completo</label><Input name="nombre" required /></div>
        <div><label className="text-xs font-medium">DNI</label><Input name="dni" required /></div>
        <div><label className="text-xs font-medium">Cargo</label><Input name="cargo" required /></div>
        <div><label className="text-xs font-medium">Area</label>
          <Select name="area"><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><label className="text-xs font-medium">Sueldo base</label><Input name="sueldo" type="number" required /></div>
        <div><label className="text-xs font-medium">Fecha ingreso</label><Input name="ingreso" type="date" required /></div>
        <div className="col-span-2"><label className="text-xs font-medium">Horario asignado</label>
          <Select name="horario"><SelectTrigger><SelectValue placeholder="Seleccionar horario" /></SelectTrigger>
            <SelectContent>{horarios.map(h => <SelectItem key={h.id} value={h.id}>{h.nombre} ({h.entrada}–{h.salida})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancelar</Button>
        <Button type="submit" className="flex-1 bg-gradient-primary" disabled={subiendo}>
          {subiendo ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo foto...</> : "Registrar"}
        </Button>
      </div>
    </form>
  );
}

function Info({ icon: Icon, label, value, className = "" }: { icon: typeof Mail; label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>
    </div>
  );
}

function Stat({ valor, label, color }: { valor: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
