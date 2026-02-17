// @ts-nocheck - Type issues to be fixed
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function OccupancySettings() {
  const [, setLocation] = useLocation();
  const { data: clinicConfig } = trpc.settings.getClinicConfig.useQuery();
  const { data: thresholds, refetch } = trpc.chairOccupancyAlerts.getAllThresholds.useQuery();
  const updateThresholdMutation = trpc.chairOccupancyAlerts.updateThreshold.useMutation({
    onSuccess: () => {
      toast.success("Configuración guardada");
      refetch();
    },
    onError: () => {
      toast.error("Error al guardar configuración");
    },
  });

  const [localThresholds, setLocalThresholds] = useState<Record<string, { min: number; critical: number }>>({});

  useEffect(() => {
    if (thresholds) {
      const thresholdMap: Record<string, { min: number; critical: number }> = {};
      thresholds.forEach(t => {
        thresholdMap[t.chair] = {
          min: t.minOccupancyThreshold,
          critical: t.criticalThreshold,
        };
      });
      setLocalThresholds(thresholdMap);
    }
  }, [thresholds]);

  // Generate chair list from config
  const chairs: string[] = [];
  if (clinicConfig) {
    for (let i = 1; i <= clinicConfig.orthodonticChairs; i++) {
      chairs.push(`Cadeira ${i} Orto`);
    }
    for (let i = 1; i <= clinicConfig.clinicChairs; i++) {
      chairs.push(`Cadeira ${i} Clínico`);
    }
  }

  const handleSave = (chair: string) => {
    const threshold = localThresholds[chair];
    if (!threshold) return;

    if (threshold.critical >= threshold.min) {
      toast.error("El umbral crítico debe ser menor que el umbral mínimo");
      return;
    }

    updateThresholdMutation.mutate({
      chair,
      minThreshold: threshold.min,
      criticalThreshold: threshold.critical,
    });
  };

  const handleChange = (chair: string, type: 'min' | 'critical', value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalThresholds(prev => ({
      ...prev,
      [chair]: {
        ...prev[chair],
        [type]: Math.max(0, Math.min(100, numValue)),
      },
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/chair-statistics")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración de Alertas de Ocupación</h1>
            <p className="text-muted-foreground mt-2">
              Define los umbrales de ocupación para cada cadeira. El sistema generará alertas automáticas cuando se superen estos límites.
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              ¿Cómo funcionan los umbrales?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Umbral Mínimo:</strong> Cuando la ocupación cae por debajo de este porcentaje, se genera una <strong>alerta de advertencia</strong> (amarilla).
            </p>
            <p>
              <strong>Umbral Crítico:</strong> Cuando la ocupación cae por debajo de este porcentaje, se genera una <strong>alerta crítica</strong> (roja) que requiere acción inmediata.
            </p>
            <p className="pt-2 border-t border-blue-300 dark:border-blue-700">
              <strong>Recomendación:</strong> El umbral crítico debe ser siempre menor que el umbral mínimo. Por ejemplo: Mínimo 60%, Crítico 40%.
            </p>
          </CardContent>
        </Card>

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chairs.map((chair: string) => {
            const threshold = localThresholds[chair] || { min: 60, critical: 40 };
            const hasChanges = thresholds?.find(t => t.chair === chair) && (
              thresholds.find(t => t.chair === chair)?.minOccupancyThreshold !== threshold.min ||
              thresholds.find(t => t.chair === chair)?.criticalThreshold !== threshold.critical
            );

            return (
              <Card key={chair}>
                <CardHeader>
                  <CardTitle>{chair}</CardTitle>
                  <CardDescription>
                    Configura los umbrales de ocupación para esta cadeira
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Min Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor={`${chair}-min`}>
                      Umbral Mínimo (%)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`${chair}-min`}
                        type="number"
                        min="0"
                        max="100"
                        value={threshold.min}
                        onChange={(e) => handleChange(chair, 'min', e.target.value)}
                        className="flex-1"
                      />
                      <div className="w-16 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          threshold.min >= 70
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : threshold.min >= 50
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {threshold.min}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alerta de advertencia cuando ocupación &lt; {threshold.min}%
                    </p>
                  </div>

                  {/* Critical Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor={`${chair}-critical`}>
                      Umbral Crítico (%)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`${chair}-critical`}
                        type="number"
                        min="0"
                        max="100"
                        value={threshold.critical}
                        onChange={(e) => handleChange(chair, 'critical', e.target.value)}
                        className="flex-1"
                      />
                      <div className="w-16 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          {threshold.critical}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alerta crítica cuando ocupación &lt; {threshold.critical}%
                    </p>
                  </div>

                  {/* Validation Warning */}
                  {threshold.critical >= threshold.min && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        ⚠️ El umbral crítico debe ser menor que el umbral mínimo
                      </p>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={() => handleSave(chair)}
                    disabled={threshold.critical >= threshold.min || updateThresholdMutation.isPending}
                    className="w-full"
                    variant={hasChanges ? "default" : "outline"}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {hasChanges ? 'Guardar Cambios' : 'Guardado'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {chairs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay cadeiras configuradas</h3>
              <p className="text-muted-foreground">
                Configura las cadeiras en la configuración de la clínica para poder establecer umbrales de ocupación.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
