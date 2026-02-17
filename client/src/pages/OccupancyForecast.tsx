import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OccupancyForecast() {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [daysAhead, setDaysAhead] = useState<number>(7);

  // Fetch predictions for selected date
  const { data: predictions, isLoading: predictionsLoading } = trpc.occupancyForecast.predictOccupancy.useQuery({
    targetDate: selectedDate,
  });

  // Fetch best time slots
  const { data: bestSlots, isLoading: slotsLoading } = trpc.occupancyForecast.getBestTimeSlots.useQuery({
    daysAhead,
  });

  // Fetch optimization recommendations
  const { data: optimization, isLoading: optimizationLoading } = trpc.occupancyForecast.optimizeDistribution.useQuery({
    targetDate: selectedDate,
  });

  const isLoading = predictionsLoading || slotsLoading || optimizationLoading;

  // Group predictions by chair for heatmap
  const chairsMap = new Map<string, typeof predictions>();
  if (predictions) {
    for (const pred of predictions) {
      if (!chairsMap.has(pred.chair)) {
        chairsMap.set(pred.chair, []);
      }
      chairsMap.get(pred.chair)!.push(pred);
    }
  }

  const chairs = Array.from(chairsMap.keys()).sort();

  // Get color based on occupancy
  const getOccupancyColor = (occupancy: number, isRecommended: boolean) => {
    if (isRecommended) return "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300";
    if (occupancy < 40) return "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400";
    if (occupancy < 70) return "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/chair-statistics")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Previsión de Ocupación</h1>
              <p className="text-muted-foreground mt-2">Cargando predicciones...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/chair-statistics")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Previsión de Ocupación</h1>
              <p className="text-muted-foreground mt-2">
                Sistema inteligente de recomendación de horarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            />
            <Select value={daysAhead.toString()} onValueChange={(v) => setDaysAhead(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Siguientes 7 días</SelectItem>
                <SelectItem value="14">Siguientes 14 días</SelectItem>
                <SelectItem value="30">Siguientes 30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Best Time Slots Recommendations */}
        {bestSlots && bestSlots.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Mejores Horarios Recomendados
              </CardTitle>
              <CardDescription>
                Top horarios con baja ocupación y alta confianza (próximos {daysAhead} días)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {bestSlots.slice(0, 6).map((slot, index) => (
                  <div
                    key={`${slot.date}-${slot.hour}-${slot.chair}`}
                    className="p-4 border rounded-lg bg-background hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {new Date(slot.date).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {slot.hour}:00 - {slot.hour + 1}:00
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {slot.score}
                        </div>
                        <div className="text-xs text-muted-foreground">score</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">{slot.chair}</p>
                      <p className="text-xs text-muted-foreground">{slot.reason}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              slot.predictedOccupancy < 40 ? 'bg-green-500' :
                              slot.predictedOccupancy < 70 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${slot.predictedOccupancy}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {slot.predictedOccupancy.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Calor de Ocupación - {new Date(selectedDate).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</CardTitle>
            <CardDescription>
              Predicción de ocupación por cadeira y horario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {predictions && predictions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-semibold border-b">Cadeira</th>
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                        <th key={hour} className="p-2 text-center text-xs font-medium border-b">
                          {hour}:00
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chairs.map(chair => (
                      <tr key={chair} className="border-b">
                        <td className="p-2 text-sm font-medium">{chair}</td>
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => {
                          const pred = chairsMap.get(chair)?.find(p => p.hour === hour);
                          if (!pred) {
                            return <td key={hour} className="p-1"></td>;
                          }
                          return (
                            <td key={hour} className="p-1">
                              <div
                                className={`
                                  w-full h-12 rounded border flex items-center justify-center text-xs font-semibold
                                  ${getOccupancyColor(pred.predictedOccupancy, pred.isRecommended)}
                                  ${pred.isRecommended ? 'ring-2 ring-green-500' : ''}
                                `}
                                title={`${pred.predictedOccupancy.toFixed(1)}% ocupación\nConfianza: ${pred.confidence}%${pred.isRecommended ? '\n✓ Recomendado' : ''}`}
                              >
                                {pred.predictedOccupancy.toFixed(0)}%
                                {pred.isRecommended && (
                                  <Sparkles className="h-3 w-3 ml-1" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos suficientes para generar predicciones</p>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border bg-green-500/10 border-green-500/30"></div>
                <span>Baja ocupación (&lt;40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border bg-yellow-500/10 border-yellow-500/30"></div>
                <span>Ocupación moderada (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border bg-red-500/10 border-red-500/30"></div>
                <span>Alta ocupación (&gt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border bg-green-500/20 border-green-500/50 ring-2 ring-green-500"></div>
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Recomendado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Recommendations */}
        {optimization && optimization.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Optimización de Distribución de Carga
              </CardTitle>
              <CardDescription>
                Recomendaciones para balancear la ocupación entre cadeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimization.map(opt => {
                  const isUnderloaded = opt.currentLoad < opt.optimalLoad;
                  const isOverloaded = opt.currentLoad > opt.optimalLoad;
                  
                  return (
                    <div
                      key={opt.chair}
                      className={`p-4 border rounded-lg ${
                        isUnderloaded ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                        isOverloaded ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' :
                        'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{opt.chair}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Carga actual: {opt.currentLoad}% | Óptima: {opt.optimalLoad}%
                          </p>
                        </div>
                        <div className="text-right">
                          {isUnderloaded && (
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <AlertCircle className="h-5 w-5" />
                              <div>
                                <p className="text-sm font-semibold">Subcargada</p>
                                <p className="text-xs">+{opt.recommendedSlots} slots disponibles</p>
                              </div>
                            </div>
                          )}
                          {isOverloaded && (
                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                              <AlertCircle className="h-5 w-5" />
                              <div>
                                <p className="text-sm font-semibold">Sobrecargada</p>
                                <p className="text-xs">Considerar redistribuir</p>
                              </div>
                            </div>
                          )}
                          {!isUnderloaded && !isOverloaded && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <TrendingUp className="h-5 w-5" />
                              <div>
                                <p className="text-sm font-semibold">Óptima</p>
                                <p className="text-xs">Bien balanceada</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
