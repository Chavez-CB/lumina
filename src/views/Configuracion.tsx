// Módulo de Configuración del sistema
import { useState } from "react";
import { Building2, Clock, BadgePercent, KeyRound, Palette, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { empresa, configDescuentos } from "../lib/mockData";
import { useTheme } from "../components/App";
import { toast } from "sonner";

export default function Configuracion() {
  const { theme, toggle } = useTheme();
  const guardar = () => toast.success("Configuración guardada", { description: "Los cambios se aplicaron correctamente." });

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-sm text-muted-foreground">Personaliza el sistema según las políticas de tu empresa.</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="bg-card border border-border flex-wrap h-auto">
          <TabsTrigger value="empresa"><Building2 className="h-4 w-4 mr-1.5" />Empresa</TabsTrigger>
          <TabsTrigger value="horarios"><Clock className="h-4 w-4 mr-1.5" />Horarios</TabsTrigger>
          <TabsTrigger value="politica"><BadgePercent className="h-4 w-4 mr-1.5" />Política descuentos</TabsTrigger>
          <TabsTrigger value="cuenta"><KeyRound className="h-4 w-4 mr-1.5" />Cuenta admin</TabsTrigger>
          <TabsTrigger value="apariencia"><Palette className="h-4 w-4 mr-1.5" />Apariencia</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Tarjeta titulo="Datos de la empresa">
            <Campo label="Nombre" defaultValue={empresa.nombre} />
            <Campo label="RUC" defaultValue={empresa.ruc} />
            <Campo label="Dirección" defaultValue={empresa.direccion} className="md:col-span-2" />
            <Campo label="Logo (URL)" placeholder="https://..." className="md:col-span-2" />
          </Tarjeta>
        </TabsContent>

        <TabsContent value="horarios" className="mt-4">
          <Tarjeta titulo="Horario laboral general">
            <Campo label="Hora de entrada" type="time" defaultValue="08:00" />
            <Campo label="Hora de salida" type="time" defaultValue="17:00" />
            <Campo label="Tolerancia (minutos)" type="number" defaultValue={configDescuentos.toleranciaMinutos.toString()} />
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Días laborables</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["L","M","X","J","V","S","D"].map((d, i) => (
                  <button key={i} className={`h-10 w-10 rounded-lg font-semibold transition-base ${i < 5 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </Tarjeta>
        </TabsContent>

        <TabsContent value="politica" className="mt-4">
          <Tarjeta titulo="Descuentos automáticos">
            <Campo label="Monto por tardanza (S/)" type="number" defaultValue={configDescuentos.montoTardanza.toString()} />
            <Campo label="% de día por falta injustificada" type="number" defaultValue={configDescuentos.porcentajeFalta.toString()} />
            <div className="md:col-span-2 rounded-xl bg-primary-soft p-4 text-sm text-primary border border-primary/20">
              <p className="font-semibold">Ejemplo de cálculo</p>
              <p className="text-foreground mt-1">Cada tardanza descuenta <strong>S/ {configDescuentos.montoTardanza}</strong> y cada falta injustificada descuenta el <strong>{configDescuentos.porcentajeFalta}%</strong> del sueldo diario.</p>
            </div>
          </Tarjeta>
        </TabsContent>

        <TabsContent value="cuenta" className="mt-4">
          <Tarjeta titulo="Credenciales de administrador">
            <Campo label="Usuario actual" defaultValue="admin" disabled />
            <Campo label="Contraseña actual" type="password" placeholder="••••••••" />
            <Campo label="Nuevo usuario" placeholder="admin" />
            <Campo label="Nueva contraseña" type="password" placeholder="Mínimo 8 caracteres" />
          </Tarjeta>
        </TabsContent>

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
        <Button onClick={guardar} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Guardar cambios</Button>
      </div>
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
