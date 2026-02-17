// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Phone, Mail, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RiskAlertsPanel() {
  const { data: riskPatients = [], isLoading } = trpc.patients.getRiskAlerts.useQuery();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 hover:bg-red-600';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      default: return 'Bajo';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  if (riskPatients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            Alertas de Riesgo
          </CardTitle>
          <CardDescription>
            No hay pacientes con riesgo de inadimplencia detectado
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas de Riesgo
            <Badge variant="destructive" className="ml-auto">
              {riskPatients.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Pacientes con comportamiento de riesgo de inadimplencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskPatients.slice(0, 5).map(({ patient, riskScore }: any) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => setSelectedPatient({ patient, riskScore })}
              >
                <div className="flex-1">
                  <p className="font-medium">{patient.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRiskColor(riskScore.level)}>
                    {getRiskLabel(riskScore.level)}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{riskScore.score}/100</p>
                    <p className="text-xs text-muted-foreground">
                      {riskScore.factors.length} factores
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {riskPatients.length > 5 && (
              <Button variant="outline" className="w-full">
                Ver todos ({riskPatients.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alerta de Riesgo: {selectedPatient?.patient.fullName}
            </DialogTitle>
            <DialogDescription>
              Análisis detallado del comportamiento del paciente
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-4">
              {/* Score de risco */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nivel de Riesgo</p>
                  <p className="text-2xl font-bold">
                    {getRiskLabel(selectedPatient.riskScore.level)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Puntuación</p>
                  <p className="text-2xl font-bold">{selectedPatient.riskScore.score}/100</p>
                </div>
              </div>

              {/* Fatores de risco */}
              <div>
                <h4 className="font-medium mb-2">Factores Identificados</h4>
                <div className="space-y-2">
                  {selectedPatient.riskScore.factors.map((factor: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                      <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{factor.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Impacto: +{factor.impact.toFixed(1)} puntos
                        </p>
                      </div>
                      <Badge variant="outline">{factor.occurrences}x</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações recomendadas */}
              <div>
                <h4 className="font-medium mb-2">Acción Recomendada</h4>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm">
                    {selectedPatient.riskScore.level === 'critical' 
                      ? '🔴 Contactar URGENTEMENTE antes de próxima cita. Considerar solicitar pago anticipado.'
                      : selectedPatient.riskScore.level === 'high'
                      ? '🟠 Enviar recordatorio con 48h de anticipación. Confirmar presencia.'
                      : '🟡 Monitorear comportamiento en próximas citas.'
                    }
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
                <Button className="flex-1" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
