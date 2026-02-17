// @ts-nocheck - Type issues to be fixed
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar, Clock, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

export default function ReminderEffectiveness() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("week");

  // Calculate date range based on period
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data: stats, isLoading } = trpc.reports.reminderEffectiveness.useQuery({
    startDate,
    endDate,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Ninguno dado disponível</p>
      </div>
    );
  }

  const bestHourData = stats.hourlyStats.find(h => h.hour === stats.overallStats.bestHour);
  const worstHourData = stats.hourlyStats.find(h => h.hour === stats.overallStats.worstHour);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Efetividade de Recordatórios</h1>
          <p className="text-muted-foreground">
            Análise de taxa de confirmação por horário de envio
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          <Button
            variant={period === "week" ? "default" : "outline"}
            onClick={() => setPeriod("week")}
          >
            Última Semana
          </Button>
          <Button
            variant={period === "month" ? "default" : "outline"}
            onClick={() => setPeriod("month")}
          >
            Último Mês
          </Button>
          <Button
            variant={period === "quarter" ? "default" : "outline"}
            onClick={() => setPeriod("quarter")}
          >
            Último Trimestre
          </Button>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Recordatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overallStats.totalReminders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.overallStats.totalConfirmed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Confirmação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.overallStats.overallConfirmationRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Melhor Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="text-3xl font-bold">
                {stats.overallStats.bestHour !== null ? `${stats.overallStats.bestHour}h` : "N/A"}
              </div>
            </div>
            {bestHourData && (
              <p className="text-sm text-muted-foreground mt-1">
                {bestHourData.confirmationRate.toFixed(1)}% de confirmação
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Efetividade por Horário
          </CardTitle>
          <CardDescription>
            Taxa de confirmação e tempo médio de resposta por horário de envio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Horário</th>
                  <th className="text-right py-3 px-4">Enviados</th>
                  <th className="text-right py-3 px-4">Confirmados</th>
                  <th className="text-right py-3 px-4">Taxa</th>
                  <th className="text-right py-3 px-4">Tempo Médio</th>
                  <th className="text-right py-3 px-4">Visual</th>
                </tr>
              </thead>
              <tbody>
                {stats.hourlyStats
                  .filter(h => h.totalSent > 0)
                  .map((hourData) => (
                    <tr
                      key={hourData.hour}
                      className={`border-b hover:bg-muted/50 ${
                        hourData.hour === stats.overallStats.bestHour
                          ? "bg-green-50 dark:bg-green-950/20"
                          : hourData.hour === stats.overallStats.worstHour
                          ? "bg-red-50 dark:bg-red-950/20"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">
                        {hourData.hour}:00
                        {hourData.hour === stats.overallStats.bestHour && (
                          <span className="ml-2 text-xs text-green-600">🏆 Melhor</span>
                        )}
                      </td>
                      <td className="text-right py-3 px-4">{hourData.totalSent}</td>
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">
                        {hourData.totalConfirmed}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={`font-semibold ${
                            hourData.confirmationRate >= 70
                              ? "text-green-600"
                              : hourData.confirmationRate >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {hourData.confirmationRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {hourData.avgResponseTimeMinutes !== null
                          ? `${Math.floor(hourData.avgResponseTimeMinutes / 60)}h ${
                              hourData.avgResponseTimeMinutes % 60
                            }m`
                          : "N/A"}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              hourData.confirmationRate >= 70
                                ? "bg-green-600"
                                : hourData.confirmationRate >= 50
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${hourData.confirmationRate}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Tendência Diária
          </CardTitle>
          <CardDescription>Evolução da taxa de confirmação ao longo do período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.dailyTrend.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">
                  {new Date(day.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm">
                      {day.totalConfirmed}/{day.totalSent}
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      {day.confirmationRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${day.confirmationRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">💡 Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
          {stats.overallStats.bestHour !== null && bestHourData && (
            <p>
              • <strong>Melhor horário:</strong> {stats.overallStats.bestHour}:00 com{" "}
              {bestHourData.confirmationRate.toFixed(1)}% de taxa de confirmação
            </p>
          )}
          {stats.overallStats.worstHour !== null && worstHourData && (
            <p>
              • <strong>Horário com menor resposta:</strong> {stats.overallStats.worstHour}:00 com{" "}
              {worstHourData.confirmationRate.toFixed(1)}% de taxa de confirmação
            </p>
          )}
          <p>
            • <strong>Recomendação:</strong> Priorize envios nos horários com melhor taxa de
            confirmação para otimizar resultados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
