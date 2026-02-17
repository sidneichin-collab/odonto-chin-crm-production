import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
// import WhatsAppQR from "@/components/WhatsAppQR"; // Temporarily disabled
import ClinicConfigCard from "@/components/ClinicConfigCard";
import { EmailConfigCard } from "@/components/EmailConfigCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuraciones</h1>
          <p className="text-muted-foreground mt-2">
            Configure WhatsApp, email e recordatórios automáticos
          </p>
        </div>

        <Tabs defaultValue="whatsapp" className="space-y-4">
          <TabsList>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="clinic">WhatsApp Clínica</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="reminders">Recordatórios</TabsTrigger>
            <TabsTrigger value="chairs">Cadeiras</TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="space-y-4">
            {/* <WhatsAppQR /> Temporarily disabled */}
            <p className="text-sm text-muted-foreground">WhatsApp integration coming soon...</p>
          </TabsContent>

          <TabsContent value="clinic" className="space-y-4">
            <ClinicConfigCard />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <EmailConfigCard />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configuración de Recordatórios
                </CardTitle>
                <CardDescription>
                  Personalize os horários e mensagens dos recordatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Horários Programados</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>2 dias antes da consulta:</strong> 10:00, 15:00, 19:00</p>
                    <p><strong>1 dia antes da consulta:</strong> 9:00, 12:00, 15:00, 18:00, 21:00</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Sistema Anti-Bloqueio</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Intervalo entre mensagens: 30-90 segundos (aleatório)</p>
                    <p>• Intervalo entre pacientes: 5 segundos</p>
                    <p>• Máximo de tentativas: 5 por consulta</p>
                    <p>• Retry após falha: 3 horas</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Dica:</strong> O sistema para automaticamente de enviar
                    recordatórios quando o paciente confirma presença, evitando mensagens
                    desnecessárias.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chairs" className="space-y-4">
            <ChairsConfigCard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function ChairsConfigCard() {
  const { data: clinicConfig, isLoading } = trpc.settings.getClinicConfig.useQuery();
  const [orthodonticChairs, setOrthodonticChairs] = useState(clinicConfig?.orthodonticChairs || 3);
  const [clinicChairs, setClinicChairs] = useState(clinicConfig?.clinicChairs || 1);

  const updateConfig = trpc.settings.updateClinicConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuración guardada com éxito!");
    },
    onError: (error) => {
      toast.error(`Error al guardar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig.mutate({
      orthodonticChairs,
      clinicChairs,
    });
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando configuración...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Cadeiras</CardTitle>
        <CardDescription>
          Define cuántas cadeiras tiene tu clínica para cada tipo de atención
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="orthodonticChairs" className="text-sm font-medium">Cadeiras de Ortodoncia</label>
              <input
                id="orthodonticChairs"
                type="number"
                min="1"
                max="10"
                value={orthodonticChairs}
                onChange={(e) => setOrthodonticChairs(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
              <p className="text-sm text-muted-foreground">
                Número de cadeiras dedicadas a ortodoncia
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="clinicChairs" className="text-sm font-medium">Cadeiras de Clínico Geral</label>
              <input
                id="clinicChairs"
                type="number"
                min="1"
                max="10"
                value={clinicChairs}
                onChange={(e) => setClinicChairs(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
              <p className="text-sm text-muted-foreground">
                Número de cadeiras dedicadas a clínico geral
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateConfig.isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {updateConfig.isPending ? "Guardando..." : "Guardar Configuración"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <h3 className="font-semibold">Vista Previa del Grid</h3>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Columnas de Ortodoncia:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: orthodonticChairs }, (_, i) => (
                <div key={i} className="px-3 py-2 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                  Cadeira {i+1} Orto
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Columnas de Clínico Geral:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: clinicChairs }, (_, i) => (
                <div key={i} className="px-3 py-2 bg-green-100 dark:bg-green-900 rounded text-sm">
                  Cadeira {i+1} Clínico
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Columna de Marketing:</p>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-2 bg-purple-100 dark:bg-purple-900 rounded text-sm">
                Evaluación Marketing
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
