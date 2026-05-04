// Módulo de Empleados — listado, filtros, ficha
import { useState } from "react";
import { Search, UserPlus, Mail, Briefcase, Building2, Calendar, Camera, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { empleados, areas, getAsistencias } from "../lib/mockData";
import type { Empleado } from "../lib/mockData";
import EstadoBadge from "../components/EstadoBadge";

export default function Empleados() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("todas");
  const [seleccionado, setSeleccionado] = useState<Empleado | null>(null);
  const [openNuevo, setOpenNuevo] = useState(false);

  const lista = empleados.filter(e =>
    (area === "todas" || e.area === area) &&
    (e.nombre.toLowerCase().includes(q.toLowerCase()) || e.dni.includes(q) || e.cargo.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personal</h2>
          <p className="text-sm text-muted-foreground">{empleados.length} empleados activos en la organización.</p>
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
            <SelectItem value="todas">Todas las áreas</SelectItem>
            {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lista.map(e => (
          <button key={e.id} onClick={() => setSeleccionado(e)} className="text-left rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-smooth group">
            <div className="flex items-start gap-3">
              <div className="relative">
                <img src={e.foto} alt={e.nombre} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-base" />
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight truncate">{e.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.cargo}</p>
                <span className="inline-block mt-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-soft text-primary font-semibold">{e.area}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">DNI</p>
                <p className="font-mono font-medium">{e.dni}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sueldo</p>
                <p className="font-semibold text-primary">S/ {e.sueldoBase.toLocaleString()}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Ficha del empleado */}
      <Dialog open={!!seleccionado} onOpenChange={() => setSeleccionado(null)}>
        <DialogContent className="max-w-2xl">
          {seleccionado && <FichaEmpleado emp={seleccionado} />}
        </DialogContent>
      </Dialog>

      {/* Nuevo empleado */}
      <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar nuevo empleado</DialogTitle>
          </DialogHeader>
          <FormularioNuevo onClose={() => setOpenNuevo(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FichaEmpleado({ emp }: { emp: Empleado }) {
  const empAsist = getAsistencias().filter(a => a.empleadoId === emp.id);
  const puntuales = empAsist.filter(a => a.estado === "puntual").length;
  const tardanzas = empAsist.filter(a => a.estado === "tardanza").length;
  const ausentes = empAsist.filter(a => a.estado === "ausente").length;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-primary -m-6 mb-0 p-6 rounded-t-2xl text-primary-foreground">
        <div className="flex items-center gap-4">
          <img src={emp.foto} alt={emp.nombre} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30" />
          <div>
            <h3 className="text-xl font-bold">{emp.nombre}</h3>
            <p className="opacity-90 text-sm">{emp.cargo}</p>
            <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">{emp.area}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info icon={Mail} label="DNI" value={emp.dni} />
        <Info icon={Briefcase} label="Sueldo base" value={`S/ ${emp.sueldoBase.toLocaleString()}`} />
        <Info icon={Building2} label="Horario" value={`${emp.horarioEntrada} - ${emp.horarioSalida}`} />
        <Info icon={Calendar} label="Ingreso" value={new Date(emp.fechaIngreso).toLocaleDateString("es-PE")} />
      </div>

      <div className="rounded-xl bg-muted/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Resumen del mes</p>
        <div className="grid grid-cols-3 gap-3">
          <Stat valor={puntuales} label="Puntuales" color="text-primary" />
          <Stat valor={tardanzas} label="Tardanzas" color="text-warning" />
          <Stat valor={ausentes} label="Ausentes" color="text-accent" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1">Editar</Button>
        <Button className="flex-1 bg-gradient-primary">Ver historial</Button>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
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

function FormularioNuevo({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onClose(); }}>
      <div className="flex flex-col items-center py-4">
        <div className="h-24 w-24 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center mb-2">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">Foto para reconocimiento facial</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium">Nombre completo</label><Input required /></div>
        <div><label className="text-xs font-medium">DNI</label><Input required /></div>
        <div><label className="text-xs font-medium">Cargo</label><Input required /></div>
        <div><label className="text-xs font-medium">Área</label>
          <Select><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><label className="text-xs font-medium">Sueldo base</label><Input type="number" required /></div>
        <div><label className="text-xs font-medium">Fecha ingreso</label><Input type="date" required /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancelar</Button>
        <Button type="submit" className="flex-1 bg-gradient-primary">Registrar</Button>
      </div>
    </form>
  );
}
