export type EstadoAsistencia = "puntual" | "tardanza" | "ausente" | "justificado";

export interface Horario {
  id: string;
  nombre: string;
  entrada: string;
  salida: string;
  toleranciaMinutos: number;
  diasLaborables: number[]; // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
  area?: string;            // area por defecto (opcional)
}

export interface Empleado {
  id: string;
  nombre: string;
  dni: string;
  cargo: string;
  area: string;
  sueldoBase: number;
  fechaIngreso: string;
  foto: string;
  activo: boolean;
  horarioEntrada: string;
  horarioSalida: string;
  horarioId: string;        // referencia al horario asignado
}

export interface Asistencia {
  id: string;
  empleadoId: string;
  fecha: string;
  entrada: string | null;
  salida: string | null;
  horasTrabajadas: number;
  estado: EstadoAsistencia;
  metodo: "facial";
}

export interface Impuesto {
  id: string;
  nombre: string;
  porcentaje: number;
  aplicaTodos: boolean;
  tipo: "deduccion" | "aporte";
  activo: boolean;
}

export interface Reconocido {
  empleado: Empleado;
  hora: string;
  tipo: "entrada" | "salida";
  estadoMarca: "puntual" | "tardanza";
}

const avatar = (seed: string) => `https://i.pravatar.cc/150?u=${seed}`;

export const horarios: Horario[] = [
  { id: "h1", nombre: "Administrativo",     entrada: "08:00", salida: "17:00", toleranciaMinutos: 10, diasLaborables: [1,2,3,4,5] },
  { id: "h2", nombre: "Tecnologia",         entrada: "09:00", salida: "18:00", toleranciaMinutos: 15, diasLaborables: [1,2,3,4,5] },
  { id: "h3", nombre: "Logistica",          entrada: "07:00", salida: "16:00", toleranciaMinutos:  5, diasLaborables: [1,2,3,4,5,6] },
  { id: "h4", nombre: "Recursos Humanos",   entrada: "08:30", salida: "17:30", toleranciaMinutos: 10, diasLaborables: [1,2,3,4,5] },
  { id: "h5", nombre: "Turno extendido",    entrada: "08:00", salida: "18:00", toleranciaMinutos: 10, diasLaborables: [1,2,3,4,5] },
];

export const empleados: Empleado[] = [
  { id: "e1",  nombre: "Camila Rojas Vega",       dni: "70123456", cargo: "Gerente de Ventas",        area: "Ventas",             sueldoBase: 4500, fechaIngreso: "2022-03-15", foto: avatar("camila"),    activo: true, horarioEntrada: "08:00", horarioSalida: "17:00", horarioId: "h1" },
  { id: "e2",  nombre: "Diego Salazar Nunez",      dni: "70987654", cargo: "Desarrollador Senior",     area: "Tecnologia",         sueldoBase: 5200, fechaIngreso: "2021-07-01", foto: avatar("diego"),     activo: true, horarioEntrada: "09:00", horarioSalida: "18:00", horarioId: "h2" },
  { id: "e3",  nombre: "Valeria Ortiz Campos",     dni: "71234567", cargo: "Disenadora UX",            area: "Tecnologia",         sueldoBase: 3800, fechaIngreso: "2023-01-20", foto: avatar("valeria"),   activo: true, horarioEntrada: "09:00", horarioSalida: "18:00", horarioId: "h2" },
  { id: "e4",  nombre: "Mateo Quispe Lima",        dni: "72345678", cargo: "Contador",                 area: "Finanzas",           sueldoBase: 4100, fechaIngreso: "2020-11-05", foto: avatar("mateo"),     activo: true, horarioEntrada: "08:00", horarioSalida: "17:00", horarioId: "h1" },
  { id: "e5",  nombre: "Lucia Fernandez Soto",     dni: "73456789", cargo: "Analista RRHH",            area: "Recursos Humanos",   sueldoBase: 3500, fechaIngreso: "2022-09-12", foto: avatar("lucia"),     activo: true, horarioEntrada: "08:30", horarioSalida: "17:30", horarioId: "h4" },
  { id: "e6",  nombre: "Adrian Torres Mendoza",    dni: "74567890", cargo: "Ejecutivo Comercial",      area: "Ventas",             sueldoBase: 3200, fechaIngreso: "2023-05-08", foto: avatar("adrian"),    activo: true, horarioEntrada: "08:00", horarioSalida: "17:00", horarioId: "h1" },
  { id: "e7",  nombre: "Sofia Paredes Rios",       dni: "75678901", cargo: "Marketing Digital",        area: "Marketing",          sueldoBase: 3700, fechaIngreso: "2022-12-01", foto: avatar("sofia"),     activo: true, horarioEntrada: "09:00", horarioSalida: "18:00", horarioId: "h2" },
  { id: "e8",  nombre: "Renato Vargas Pinto",      dni: "76789012", cargo: "Soporte TI",               area: "Tecnologia",         sueldoBase: 2900, fechaIngreso: "2024-02-19", foto: avatar("renato"),    activo: true, horarioEntrada: "08:00", horarioSalida: "17:00", horarioId: "h1" },
  { id: "e9",  nombre: "Isabella Chavez Luna",     dni: "77890123", cargo: "Coordinadora Logistica",   area: "Logistica",          sueldoBase: 3600, fechaIngreso: "2021-04-22", foto: avatar("isabella"),  activo: true, horarioEntrada: "07:30", horarioSalida: "16:30", horarioId: "h3" },
  { id: "e10", nombre: "Joaquin Ramos Bravo",      dni: "78901234", cargo: "Almacenero",               area: "Logistica",          sueldoBase: 2400, fechaIngreso: "2023-08-14", foto: avatar("joaquin"),   activo: true, horarioEntrada: "07:00", horarioSalida: "16:00", horarioId: "h3" },
  { id: "e11", nombre: "Andrea Morales Diaz",      dni: "79012345", cargo: "Asistente Administrativa", area: "Administracion",     sueldoBase: 2600, fechaIngreso: "2024-01-10", foto: avatar("andrea"),    activo: true, horarioEntrada: "08:00", horarioSalida: "17:00", horarioId: "h1" },
  { id: "e12", nombre: "Sebastian Nunez Cruz",     dni: "70234561", cargo: "Jefe de Marketing",        area: "Marketing",          sueldoBase: 4800, fechaIngreso: "2020-06-03", foto: avatar("sebastian"), activo: true, horarioEntrada: "09:00", horarioSalida: "18:00", horarioId: "h2" },
];

export const areas = ["Ventas", "Tecnologia", "Finanzas", "Recursos Humanos", "Marketing", "Logistica", "Administracion"];

export const fechaOffset = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
};

export const fechaHoy = () => new Date().toISOString().slice(0, 10);

function sumarMinutos(hora: string, mins: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60).toString().padStart(2, "0");
  const mm = (((total % 60) + 60) % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
export { sumarMinutos };

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
export { seededRandom };

function generarAsistencias(random: () => number = Math.random): Asistencia[] {
  const lista: Asistencia[] = [];
  empleados.forEach(emp => {
    for (let d = 0; d < 30; d++) {
      const fecha = fechaOffset(d);
      const dia = new Date(fecha).getDay();
      if (dia === 0 || dia === 6) continue;
      const r = random();
      let estado: EstadoAsistencia = "puntual";
      let entrada: string | null = emp.horarioEntrada;
      let salida: string | null = emp.horarioSalida;
      let horas = 9;
      if (r < 0.75) {
        estado = "puntual";
        entrada = sumarMinutos(emp.horarioEntrada, -Math.floor(random() * 5));
      } else if (r < 0.90) {
        estado = "tardanza";
        const tarde = 11 + Math.floor(random() * 25);
        entrada = sumarMinutos(emp.horarioEntrada, tarde);
        horas = 9 - tarde / 60;
      } else if (r < 0.97) {
        estado = "ausente"; entrada = null; salida = null; horas = 0;
      } else {
        estado = "justificado"; entrada = null; salida = null; horas = 0;
      }
      lista.push({ id: `a-${emp.id}-${d}`, empleadoId: emp.id, fecha, entrada, salida, horasTrabajadas: Math.max(0, +horas.toFixed(2)), estado, metodo: "facial" });
    }
  });
  return lista;
}

let _asistencias: Asistencia[] | null = null;

export function getAsistencias(): Asistencia[] {
  if (!_asistencias) {
    const random = seededRandom(12345);
    _asistencias = generarAsistencias(random);
  }
  return _asistencias;
}

export const impuestos: Impuesto[] = [
  { id: "t1", nombre: "AFP",                    porcentaje: 13, aplicaTodos: true,  tipo: "deduccion", activo: true  },
  { id: "t2", nombre: "Renta 5ta categoria",    porcentaje: 8,  aplicaTodos: false, tipo: "deduccion", activo: true  },
  { id: "t3", nombre: "Seguro Social (EsSalud)",porcentaje: 9,  aplicaTodos: true,  tipo: "aporte",    activo: true  },
  { id: "t4", nombre: "ONP",                    porcentaje: 13, aplicaTodos: false, tipo: "deduccion", activo: false },
];

export const configDescuentos = {
  toleranciaMinutos: 10,
  montoTardanza: 15,
  porcentajeFalta: 100,
};

export const empresa = {
  nombre: "Corporacion Lumina S.A.C.",
  ruc: "20612345678",
  direccion: "Av. Javier Prado 4250, San Isidro, Lima",
  logo: "",
};

export const obtenerEmpleado = (id: string) => empleados.find(e => e.id === id);
export const asistenciasDelDia = (fecha: string) => getAsistencias().filter(a => a.fecha === fecha);
export const getHorario = (id: string) => horarios.find(h => h.id === id);
