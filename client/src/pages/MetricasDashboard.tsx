import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function MetricasDashboard() {
  const [dateRange, setDateRange] = useState("30");
  const [treatmentType, setTreatmentType] = useState("all");

  // Fetch metrics data
  const { data: confirmationRates } = trpc.statistics.getConfirmationRates.useQuery({
    groupBy: "day" as const,
    startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: reminderEffectiveness } = trpc.statistics.getReminderEffectiveness.useQuery({
    startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: channelPerformanceData } = trpc.health.getChannelHealth.useQuery({
    channelId: 1,
  });

  // Mock data for demonstration (replace with real data)
  const confirmationByDayData = (confirmationRates && Array.isArray(confirmationRates) ? confirmationRates : null) || [
    { date: "2026-01-15", confirmed: 45, pending: 15, cancelled: 5 },
    { date: "2026-01-16", confirmed: 52, pending: 12, cancelled: 3 },
    { date: "2026-01-17", confirmed: 48, pending: 18, cancelled: 4 },
    { date: "2026-01-18", confirmed: 55, pending: 10, cancelled: 2 },
    { date: "2026-01-19", confirmed: 50, pending: 14, cancelled: 6 },
    { date: "2026-01-20", confirmed: 58, pending: 8, cancelled: 4 },
    { date: "2026-01-21", confirmed: 62, pending: 6, cancelled: 2 },
  ];

  const reminderByTimeData = (reminderEffectiveness?.bySendTime || []).map((item: any) => ({
    time: item.sendTime,
    effectiveness: Math.round(item.confirmationRate),
    sent: item.totalSent,
    confirmed: item.confirmed,
  })) || [
    { time: "10h (2d)", effectiveness: 78, sent: 120, confirmed: 94 },
    { time: "15h (2d)", effectiveness: 65, sent: 100, confirmed: 65 },
    { time: "19h (2d)", effectiveness: 72, sent: 110, confirmed: 79 },
    { time: "7h (1d)", effectiveness: 85, sent: 80, confirmed: 68 },
    { time: "7h (same)", effectiveness: 90, sent: 50, confirmed: 45 },
    { time: "2h before", effectiveness: 95, sent: 30, confirmed: 29 },
  ];

  const channelData = channelPerformanceData ? [{
    name: `Canal ${channelPerformanceData.channelId}`,
    health: channelPerformanceData.healthScore,
    messages: channelPerformanceData.messagesSent,
    responseTime: channelPerformanceData.avgResponseTime,
  }] : [
    { name: "Canal 1", health: 95, messages: 450, responseTime: 2.3 },
    { name: "Canal 2", health: 88, messages: 380, responseTime: 3.1 },
    { name: "Canal 3", health: 92, messages: 420, responseTime: 2.7 },
  ];

  const treatmentDistribution = [
    { name: "Ortodoncia", value: 45 },
    { name: "Clínico", value: 35 },
    { name: "Marketing", value: 20 },
  ];

  const topPatientsData = [
    { name: "María González", confirmations: 12, responseTime: "5 min" },
    { name: "Juan Pérez", confirmations: 11, responseTime: "8 min" },
    { name: "Ana Silva", confirmations: 10, responseTime: "6 min" },
    { name: "Carlos Rodríguez", confirmations: 9, responseTime: "7 min" },
    { name: "Laura Martínez", confirmations: 9, responseTime: "10 min" },
  ];

  // Calculate overall metrics
  const totalConfirmed = confirmationByDayData.reduce((sum: number, day: any) => sum + day.confirmed, 0);
  const totalPending = confirmationByDayData.reduce((sum: number, day: any) => sum + day.pending, 0);
  const totalCancelled = confirmationByDayData.reduce((sum: number, day: any) => sum + day.cancelled, 0);
  const total = totalConfirmed + totalPending + totalCancelled;
  const confirmationRate = total > 0 ? Math.round((totalConfirmed / total) * 100) : 0;

  const avgResponseTime = channelData.length > 0 ? channelData.reduce((sum: number, ch: any) => sum + ch.responseTime, 0) / channelData.length : 0;
  const bestChannel = channelData.length > 0 ? channelData.reduce((best: any, ch: any) => ch.health > best.health ? ch : best, channelData[0]) : { name: 'N/A', health: 0 };

  const handleExportPDF = async () => {
    try {
      // Show loading state
      const button = document.querySelector('[data-export-pdf]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Exportando...';
      }

      // Get the dashboard content
      const element = document.querySelector('[data-dashboard-content]') as HTMLElement;
      if (!element) {
        alert('Erro ao capturar conteúdo do dashboard');
        return;
      }

      // Capture the content as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `dashboard-metricas-${date}.pdf`;

      // Save PDF
      pdf.save(filename);

      // Reset button state
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>Exportar PDF';
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Por favor, tente novamente.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-dashboard-content>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
            <p className="text-muted-foreground mt-1">
              Análise completa de confirmações, recordatórios e performance
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Select value={treatmentType} onValueChange={setTreatmentType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tratamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                <SelectItem value="Clínico">Clínico</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportPDF} variant="outline" data-export-pdf>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Confirmação</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmationRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalConfirmed} de {total} agendamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime.toFixed(1)} min</div>
              <p className="text-xs text-muted-foreground">
                Média dos últimos {dateRange} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canal Mais Efetivo</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestChannel?.name}</div>
              <p className="text-xs text-muted-foreground">
                {bestChannel?.health}% de saúde
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              <MessageCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {channelData.reduce((sum: number, ch: any) => sum + ch.messages, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Nos últimos {dateRange} dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confirmation Rate by Day */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Confirmação por Dia</CardTitle>
              <CardDescription>Evolução diária dos últimos {dateRange} dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={confirmationByDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="confirmed" stroke="#10b981" name="Confirmado" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pendente" strokeWidth={2} />
                  <Line type="monotone" dataKey="cancelled" stroke="#ef4444" name="Cancelado" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reminder Effectiveness by Time */}
          <Card>
            <CardHeader>
              <CardTitle>Efetividade de Recordatórios por Horário</CardTitle>
              <CardDescription>Taxa de confirmação por horário de envio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reminderByTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="effectiveness" fill="#8b5cf6" name="Efetividade (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Canal WhatsApp</CardTitle>
              <CardDescription>Saúde e volume de mensagens</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="health" fill="#10b981" name="Saúde (%)" />
                  <Bar yAxisId="right" dataKey="messages" fill="#3b82f6" name="Mensagens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Treatment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Tratamento</CardTitle>
              <CardDescription>Proporção de agendamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={treatmentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {treatmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Pacientes Mais Engajados</CardTitle>
            <CardDescription>Pacientes com maior taxa de confirmação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Nome</th>
                    <th className="text-center p-2">Confirmações</th>
                    <th className="text-center p-2">Tempo Médio de Resposta</th>
                  </tr>
                </thead>
                <tbody>
                  {topPatientsData.map((patient, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 font-medium">{patient.name}</td>
                      <td className="p-2 text-center">{patient.confirmations}</td>
                      <td className="p-2 text-center">{patient.responseTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
