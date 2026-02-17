import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, ArrowLeft, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ChairTrends() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [selectedChair, setSelectedChair] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [useCustomDates, setUseCustomDates] = useState<boolean>(false);

  // Calculate days from custom dates if set
  const effectiveDays = useCustomDates && startDate && endDate 
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : selectedPeriod;

  const { data: trends, isLoading: trendsLoading } = trpc.chairTrends.getTrends.useQuery({ days: effectiveDays });
  const { data: comparison, isLoading: comparisonLoading } = trpc.chairTrends.comparePeriods.useQuery({ days: effectiveDays });
  const { data: dayOfWeekData, isLoading: dayOfWeekLoading } = trpc.chairTrends.getOccupancyByDayOfWeek.useQuery({ days: effectiveDays });

  const isLoading = trendsLoading || comparisonLoading || dayOfWeekLoading;

  // Filter trends by selected chair
  const filteredTrends = selectedChair === "all" ? trends : trends?.filter(t => t.chair === selectedChair);

  // Get unique chairs for filter dropdown
  const availableChairs = trends?.map(t => t.chair) || [];

  // Prepare line chart data (Occupancy Evolution)
  const lineChartData = filteredTrends && filteredTrends.length > 0 ? {
    labels: filteredTrends[0].data.map(d => new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
    datasets: filteredTrends.map((trend, index) => {
      const colors = [
        { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }, // blue
        { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' }, // green
        { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)' }, // amber
        { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.1)' }, // violet
        { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.1)' }, // pink
        { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' }, // red
      ];
      const color = colors[index % colors.length];
      
      return {
        label: trend.chair,
        data: trend.data.map(d => d.occupancyRate),
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.4,
        fill: true,
      };
    }),
  } : null;

  // Prepare bar chart data (Chair Comparison)
  const barChartData = filteredTrends && filteredTrends.length > 0 ? {
    labels: filteredTrends.map(t => t.chair),
    datasets: [
      {
        label: 'Taxa de Ocupação Média (%)',
        data: filteredTrends.map(t => t.averageOccupancy),
        backgroundColor: filteredTrends.map(t => 
          t.averageOccupancy >= 80 ? 'rgba(16, 185, 129, 0.8)' :
          t.averageOccupancy >= 60 ? 'rgba(245, 158, 11, 0.8)' :
          'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: filteredTrends.map(t => 
          t.averageOccupancy >= 80 ? 'rgb(16, 185, 129)' :
          t.averageOccupancy >= 60 ? 'rgb(245, 158, 11)' :
          'rgb(239, 68, 68)'
        ),
        borderWidth: 2,
      },
    ],
  } : null;

  // Prepare day of week chart data
  const dayOfWeekChartData = dayOfWeekData ? {
    labels: dayOfWeekData.map(d => d.dayName),
    datasets: [
      {
        label: 'Ocupación Promedio (%)',
        data: dayOfWeekData.map(d => d.averageOccupancy),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 2,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
    },
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
              <h1 className="text-3xl font-bold tracking-tight">Tendências de Ocupação</h1>
              <p className="text-muted-foreground mt-2">Cargando dados históricos...</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Tendências de Ocupación</h1>
              <p className="text-muted-foreground mt-2">
                Análisis histórico y evolución de ocupación de cadeiras
              </p>
            </div>
          </div>
          
        </div>

        {/* Filtros Avançados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de Cadeira */}
              <div>
                <label className="text-sm font-medium mb-2 block">Cadeira</label>
                <Select value={selectedChair} onValueChange={setSelectedChair}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as Cadeiras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Cadeiras</SelectItem>
                    {trends?.map(trend => (
                      <SelectItem key={trend.chair} value={trend.chair}>{trend.chair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Período */}
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select 
                  value={useCustomDates ? "custom" : selectedPeriod.toString()} 
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setUseCustomDates(true);
                    } else {
                      setUseCustomDates(false);
                      setSelectedPeriod(parseInt(value));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                    <SelectItem value="365">Último año</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Inicial (só aparece em custom) */}
              {useCustomDates && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              )}

              {/* Data Final (só aparece em custom) */}
              {useCustomDates && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              )}
            </div>

            {/* Filtros Rápidos */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">Filtros Rápidos</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setSelectedPeriod(7);
                  }}
                >
                  7 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setSelectedPeriod(30);
                  }}
                >
                  30 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setSelectedPeriod(60);
                  }}
                >
                  60 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setSelectedPeriod(90);
                  }}
                >
                  90 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedChair("all");
                    setUseCustomDates(false);
                    setSelectedPeriod(30);
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Comparison Cards */}
        {comparison && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Citas</CardDescription>
                <CardTitle className="text-3xl">{comparison.current.totalAppointments}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-1 text-sm ${
                  comparison.growth.appointments >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {comparison.growth.appointments >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {comparison.growth.appointments >= 0 ? '+' : ''}{comparison.growth.appointments.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs. período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ocupación Promedio</CardDescription>
                <CardTitle className="text-3xl">{comparison.current.averageOccupancy.toFixed(1)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-1 text-sm ${
                  comparison.growth.occupancy >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {comparison.growth.occupancy >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {comparison.growth.occupancy >= 0 ? '+' : ''}{comparison.growth.occupancy.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs. período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ingresos Totales</CardDescription>
                <CardTitle className="text-3xl">R$ {comparison.current.totalRevenue.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-1 text-sm ${
                  comparison.growth.revenue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {comparison.growth.revenue >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {comparison.growth.revenue >= 0 ? '+' : ''}{comparison.growth.revenue.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs. período anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Line Chart - Occupancy Evolution */}
        {lineChartData && (
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Ocupación por Cadeira</CardTitle>
              <CardDescription>
                Tendencia de ocupación a lo largo del tiempo (últimos {selectedPeriod} días)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <Line data={lineChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bar Chart - Chair Comparison */}
        {barChartData && (
          <Card>
            <CardHeader>
              <CardTitle>Comparación de Ocupación entre Cadeiras</CardTitle>
              <CardDescription>
                Ocupación promedio por cadeira (últimos {selectedPeriod} días)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day of Week Chart */}
        {dayOfWeekChartData && (
          <Card>
            <CardHeader>
              <CardTitle>Ocupación por Día de la Semana</CardTitle>
              <CardDescription>
                Promedio de ocupación según el día de la semana (últimos {selectedPeriod} días)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Bar data={dayOfWeekChartData} options={barChartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trend Details */}
        {trends && trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Tendencia por Cadeira</CardTitle>
              <CardDescription>
                Análisis de crecimiento comparado con período anterior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.map((trend) => (
                  <div
                    key={trend.chair}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{trend.chair}</h4>
                        <p className="text-sm text-muted-foreground">
                          Ocupación promedio: {trend.averageOccupancy.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${
                      trend.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trend.trend >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      <span className="text-lg font-bold">
                        {trend.trend >= 0 ? '+' : ''}{trend.trend.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && (!trends || trends.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay datos suficientes</h3>
              <p className="text-muted-foreground">
                No hay suficientes citas registradas para generar gráficos de tendencia.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
