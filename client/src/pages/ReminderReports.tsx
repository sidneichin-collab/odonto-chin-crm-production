import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, XCircle, Clock, TrendingUp, Users } from 'lucide-react';

export default function ReminderReports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
    end: new Date(),
  });

  // Buscar métricas de recordatórios
  const { data: metrics, isLoading } = trpc.reports.getReminderMetrics.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const confirmationRate = metrics?.totalSent
    ? ((metrics.totalConfirmed / metrics.totalSent) * 100).toFixed(1)
    : '0.0';

  const rescheduleRate = metrics?.totalSent
    ? ((metrics.totalRescheduleRequests / metrics.totalSent) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Informes de Recordatórios</h1>
          <p className="text-muted-foreground">
            Métricas e análises do sistema de recordatórios automáticos
          </p>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recordatórios Enviados
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Confirmação
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {confirmationRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalConfirmed || 0} confirmações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solicitações de Reagendamento
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics?.totalRescheduleRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {rescheduleRate}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sem Resposta
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalNoResponse || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de distribuição */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Respostas</CardTitle>
          <CardDescription>
            Proporção de confirmações, reagendamentos e sem resposta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Confirmados */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Confirmados</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {confirmationRate}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600"
                  style={{ width: `${confirmationRate}%` }}
                />
              </div>
            </div>

            {/* Reagendamentos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Reagendamentos</span>
                </div>
                <span className="text-sm font-bold text-orange-600">
                  {rescheduleRate}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600"
                  style={{ width: `${rescheduleRate}%` }}
                />
              </div>
            </div>

            {/* Sem resposta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sem Resposta</span>
                </div>
                <span className="text-sm font-bold">
                  {(100 - parseFloat(confirmationRate) - parseFloat(rescheduleRate)).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-muted-foreground"
                  style={{
                    width: `${100 - parseFloat(confirmationRate) - parseFloat(rescheduleRate)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Recordatórios</CardTitle>
          <CardDescription>
            Últimos recordatórios enviados e suas respostas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Data</th>
                  <th className="text-left p-2 font-medium">Paciente</th>
                  <th className="text-left p-2 font-medium">Teléfono</th>
                  <th className="text-left p-2 font-medium">Estado</th>
                  <th className="text-left p-2 font-medium">Fase</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.history?.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      {new Date(item.sentAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-2 font-medium">{item.patientName}</td>
                    <td className="p-2">{item.patientPhone}</td>
                    <td className="p-2">
                      {item.confirmed ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Confirmado
                        </span>
                      ) : item.rescheduleRequested ? (
                        <span className="inline-flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          Reagendar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          Sem resposta
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {item.phase === 'two_days_before'
                        ? '2 días antes'
                        : item.phase === 'one_day_before'
                        ? '1 día antes'
                        : 'Día de la cita'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
