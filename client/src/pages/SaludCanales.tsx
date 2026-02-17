import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Send,
  Eye,
  Clock,
  Shield
} from "lucide-react";

export default function SaludCanales() {
  // Mock data - será substituído por dados reais do backend
  const channels = [
    {
      id: 1,
      name: "WhatsApp Canal Clínica",
      phone: "+591 7654-3200",
      type: "clinic",
      healthScore: 95,
      status: "healthy",
      metrics: {
        messagesSentToday: 234,
        messagesDelivered: 232,
        messagesRead: 198,
        messagesReplied: 145,
        deliveryRate: 99.1,
        readRate: 85.3,
        replyRate: 73.2,
        avgResponseTime: "2.5 min",
        dailyLimit: 1000,
        blockedCount: 0,
        errorCount: 2
      },
      history: [
        { date: "01/02", score: 92 },
        { date: "02/02", score: 94 },
        { date: "03/02", score: 93 },
        { date: "04/02", score: 95 },
        { date: "05/02", score: 96 },
        { date: "06/02", score: 95 },
        { date: "07/02", score: 95 }
      ]
    },
    {
      id: 2,
      name: "WhatsApp Canal Recordatorios",
      phone: "+591 7654-3210",
      type: "recordatorios",
      healthScore: 88,
      status: "healthy",
      metrics: {
        messagesSentToday: 847,
        messagesDelivered: 835,
        messagesRead: 720,
        messagesReplied: 456,
        deliveryRate: 98.6,
        readRate: 86.2,
        replyRate: 63.3,
        avgResponseTime: "N/A",
        dailyLimit: 1000,
        blockedCount: 0,
        errorCount: 12
      },
      history: [
        { date: "01/02", score: 85 },
        { date: "02/02", score: 87 },
        { date: "03/02", score: 86 },
        { date: "04/02", score: 88 },
        { date: "05/02", score: 89 },
        { date: "06/02", score: 88 },
        { date: "07/02", score: 88 }
      ]
    }
  ];

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { label: "Saludable", color: "bg-green-500" };
    if (score >= 50) return { label: "Atención", color: "bg-yellow-500" };
    return { label: "Crítico", color: "bg-red-500" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const globalStats = {
    avgHealthScore: Math.round(channels.reduce((acc, c) => acc + c.healthScore, 0) / channels.length),
    totalMessagesSent: channels.reduce((acc, c) => acc + c.metrics.messagesSentToday, 0),
    avgDeliveryRate: (channels.reduce((acc, c) => acc + c.metrics.deliveryRate, 0) / channels.length).toFixed(1),
    avgReadRate: (channels.reduce((acc, c) => acc + c.metrics.readRate, 0) / channels.length).toFixed(1)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Salud de los Canales WhatsApp</h1>
        <p className="text-gray-400">Monitoreo en tiempo real de la salud y performance de los canales</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Salud Promedio</p>
                <p className={`text-3xl font-bold ${getHealthColor(globalStats.avgHealthScore)}`}>
                  {globalStats.avgHealthScore}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Mensajes Enviados Hoy</p>
                <p className="text-3xl font-bold text-white">{globalStats.totalMessagesSent}</p>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa de Entrega</p>
                <p className="text-3xl font-bold text-white">{globalStats.avgDeliveryRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa de Lectura</p>
                <p className="text-3xl font-bold text-white">{globalStats.avgReadRate}%</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Detail */}
      <div className="space-y-6">
        {channels.map((channel) => {
          const healthBadge = getHealthBadge(channel.healthScore);
          
          return (
            <Card key={channel.id} className="bg-gray-900 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(channel.status)}
                    <div>
                      <CardTitle className="text-white">{channel.name}</CardTitle>
                      <p className="text-sm text-gray-400">{channel.phone}</p>
                    </div>
                    <Badge className={channel.type === "clinic" ? "bg-green-500" : "bg-purple-500"}>
                      {channel.type === "clinic" ? "Canal Clínica" : "Canal Recordatorios"}
                    </Badge>
                    <Badge className={healthBadge.color}>
                      {healthBadge.label}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Score de Salud</p>
                    <p className={`text-4xl font-bold ${getHealthColor(channel.healthScore)}`}>
                      {channel.healthScore}%
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Métricas del Día</h3>
                    
                    {/* Messages Sent */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Mensajes Enviados</span>
                        <span className="text-sm font-semibold text-white">
                          {channel.metrics.messagesSentToday} / {channel.metrics.dailyLimit}
                        </span>
                      </div>
                      <Progress 
                        value={(channel.metrics.messagesSentToday / channel.metrics.dailyLimit) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Delivery Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Tasa de Entrega
                        </span>
                        <span className="text-sm font-semibold text-green-500">
                          {channel.metrics.deliveryRate}%
                        </span>
                      </div>
                      <Progress 
                        value={channel.metrics.deliveryRate} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {channel.metrics.messagesDelivered} de {channel.metrics.messagesSentToday} entregados
                      </p>
                    </div>

                    {/* Read Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400 flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          Tasa de Lectura
                        </span>
                        <span className="text-sm font-semibold text-blue-500">
                          {channel.metrics.readRate}%
                        </span>
                      </div>
                      <Progress 
                        value={channel.metrics.readRate} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {channel.metrics.messagesRead} de {channel.metrics.messagesDelivered} leídos
                      </p>
                    </div>

                    {/* Reply Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Tasa de Respuesta
                        </span>
                        <span className="text-sm font-semibold text-purple-500">
                          {channel.metrics.replyRate}%
                        </span>
                      </div>
                      <Progress 
                        value={channel.metrics.replyRate} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {channel.metrics.messagesReplied} respuestas recibidas
                      </p>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Tiempo Resp. Promedio</p>
                        <p className="text-lg font-semibold text-white flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {channel.metrics.avgResponseTime}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Errores Hoy</p>
                        <p className="text-lg font-semibold text-white">
                          {channel.metrics.errorCount}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Bloqueados</p>
                        <p className="text-lg font-semibold text-white">
                          {channel.metrics.blockedCount}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Límite Diario</p>
                        <p className="text-lg font-semibold text-white">
                          {channel.metrics.dailyLimit}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: History Chart */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Historial de Salud (7 días)</h3>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="h-64 flex items-end justify-between space-x-2">
                        {channel.history.map((day, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-gray-700 rounded-t-lg relative" style={{ height: '200px' }}>
                              <div 
                                className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                                  day.score >= 80 ? 'bg-green-500' : 
                                  day.score >= 50 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}
                                style={{ height: `${(day.score / 100) * 200}px` }}
                              >
                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white">
                                  {day.score}%
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400 mt-2">{day.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trend Analysis */}
                    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-white mb-3">Análisis de Tendencia</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Tendencia Semanal</span>
                          <div className="flex items-center text-green-500">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span className="text-sm font-semibold">+3%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Estabilidad</span>
                          <Badge className="bg-green-500">Alta</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Riesgo de Bloqueo</span>
                          <Badge className="bg-green-500">Bajo</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health Indicators */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            Indicadores del Sistema Anti-Bloqueio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Control de Pulso</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">Activo</p>
              <p className="text-xs text-gray-500 mt-1">Intervalo: 3s entre mensajes</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Rotación Automática</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">Configurado</p>
              <p className="text-xs text-gray-500 mt-1">Se activa si health {'<'} 20%</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Monitoreo</span>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-white">Tiempo Real</p>
              <p className="text-xs text-gray-500 mt-1">Actualización cada 30s</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
