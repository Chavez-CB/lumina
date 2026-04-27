import type { EstadoAsistencia } from "../lib/mockData";
import { cn } from "../lib/utils";

const styles: Record<EstadoAsistencia, string> = {
  puntual: "bg-primary-soft text-primary border border-primary/20",
  tardanza: "bg-warning/10 text-warning border border-warning/20",
  ausente: "bg-accent-soft text-accent border border-accent/20",
  justificado: "bg-muted text-muted-foreground border border-border",
};

const labels: Record<EstadoAsistencia, string> = {
  puntual: "Puntual",
  tardanza: "Tardanza",
  ausente: "Ausente",
  justificado: "Justificado",
};

export default function EstadoBadge({ estado }: { estado: EstadoAsistencia }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", styles[estado])}>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        estado === "puntual" && "bg-primary",
        estado === "tardanza" && "bg-warning",
        estado === "ausente" && "bg-accent",
        estado === "justificado" && "bg-muted-foreground",
      )} />
      {labels[estado]}
    </span>
  );
}
