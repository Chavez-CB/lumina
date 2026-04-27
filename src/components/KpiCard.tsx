import type { LucideProps } from "lucide-react";
import { cn } from "../lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<LucideProps>;
  trend?: { value: string; positive?: boolean };
  variant?: "primary" | "accent" | "warning" | "muted";
}

const variantStyles = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  warning: "bg-warning/10 text-warning",
  muted: "bg-muted text-muted-foreground",
};

export default function KpiCard({ title, value, icon: Icon, trend, variant = "primary" }: KpiCardProps) {
  return (
    <div className="group rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-elevated transition-smooth">
      <div className="flex items-start justify-between">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-base group-hover:scale-105", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", trend.positive ? "bg-primary-soft text-primary" : "bg-accent-soft text-accent")}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
