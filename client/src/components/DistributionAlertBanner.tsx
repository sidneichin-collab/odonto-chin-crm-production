import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DistributionAlertBanner() {
  const { data: alerts, isLoading, refetch } = trpc.appointmentDistribution.getActiveAlerts.useQuery();
  const resolveAlertMutation = trpc.appointmentDistribution.resolveAlert.useMutation({
    onSuccess: () => {
      toast.success("Alerta resuelto");
      refetch();
    },
    onError: () => {
      toast.error("Error al resolver alerta");
    },
  });

  const [expandedAlertId, setExpandedAlertId] = useState<number | null>(null);

  if (isLoading) return null;
  if (!alerts || alerts.length === 0) return null;

  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const warningAlerts = alerts.filter(a => a.severity === "warning");

  const handleResolve = (alertId: number) => {
    resolveAlertMutation.mutate({ alertId });
  };

  const toggleExpand = (alertId: number) => {
    setExpandedAlertId(expandedAlertId === alertId ? null : alertId);
  };

  return (
    <div className="space-y-4">
      {/* Critical Alerts - Large Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 dark:bg-red-700 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-900 dark:text-red-100">
                    ¡ATENCIÓN! Distribución de Citas Desequilibrada
                  </CardTitle>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {criticalAlerts.length} problema(s) crítico(s) detectado(s) - Acción inmediata requerida
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-red-300 dark:border-red-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-900 dark:text-red-100">
                        {new Date(alert.alertDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        alert.alertType === 'empty_day'
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      }`}>
                        {alert.alertType === 'empty_day' ? 'DÍA VACÍO' : 'DÍA SOBRECARGADO'}
                      </span>
                    </div>
                    
                    <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                      {alert.message}
                    </p>

                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Citas agendadas:</strong> {alert.appointmentCount} 
                      {alert.alertType === 'empty_day' && ' (demasiado bajo)'}
                      {alert.alertType === 'overloaded_day' && ' (capacidad excedida)'}
                    </div>

                    {/* Suggested Actions */}
                    <div className="mt-3">
                      <button
                        onClick={() => toggleExpand(alert.id)}
                        className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
                      >
                        {expandedAlertId === alert.id ? '▼ Ocultar acciones' : '▶ Ver acciones sugeridas'}
                      </button>
                      
                      {expandedAlertId === alert.id && (
                        <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
                          <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                            Acciones Recomendadas:
                          </p>
                          <ul className="space-y-1">
                            {alert.suggestedActions.map((action: string, idx: number) => (
                              <li key={idx} className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                                <span className="text-red-600 dark:text-red-400">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                          {alert.affectedDates && alert.affectedDates.length > 1 && (
                            <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-700">
                              <p className="text-xs text-red-700 dark:text-red-300">
                                <strong>Fechas relacionadas:</strong> {alert.affectedDates.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(alert.id)}
                      className="whitespace-nowrap border-red-500 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Resuelto
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts - Smaller Cards */}
      {warningAlerts.length > 0 && (
        <Card className="border-yellow-500 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-lg text-yellow-900 dark:text-yellow-100">
                Advertencias de Distribución ({warningAlerts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {warningAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-gray-900 rounded-md p-3 border border-yellow-300 dark:border-yellow-800 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      {new Date(alert.alertDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {alert.message}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleResolve(alert.id)}
                  className="text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
