import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  BarChart3,
  AlertCircle,
  Target
} from "lucide-react";

export default function EfectividadRecordatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedType, setSelectedType] = useState("all");

  // Mock data - será substituído por dados reais do backend
  const overallStats = {
    totalReminders: 2580,
    confirmed: 1987,
    notConfirmed: 593,
    confirmationRate: 77.0,
    attendanceRate: 84.5,
    noShowRate: 15.5,
    avgResponseTime: "2.3h",
    improvement: "+5.2%"
  };

  const byType = [
    {
      type: "Ortodoncia",
      stats: {
        totalReminders: 1234,
        confirmed: 987,
        notConfirmed: 247,
        confirmationRate: 80.0,
        attendanceRate: 88.2,
        noShowRate: 11.8,
        avgResponseTime: "1.8h"
      },
      trend: "up",
      improvement: "+7.1%"
    },
    {
      type: "Clínico General",
      stats: {
        totalReminders: 1346,
        confirmed: 1000,
        notConfirmed: 346,
        confirmationRate: 74.3,
        attendanceRate: 81.0,
        noShowRate: 19.0,
        avgResponseTime: "2.8h"
      },
      trend: "up",
      improvement: "+3.5%"
    }
  ];

  const byMessage = [
    {
      messageType: "Primera Vez (Amigable)",
      sent: 2580,
      confirmed: 1654,
      confirmationRate: 64.1,
      avgResponseTime: "4.2h"
    },
    {
      messageType: "Seguimiento 1 (Educativo)",
      sent: 926,
      confirmed: 654,
      confirmationRate: 70.6,
      avgResponseTime: "2.1h"
    },
    {
      messageType: "Seguimiento 2 (Urgente)",
      sent: 272,
      confirmed: 198,
      confirmationRate: 72.8,
      avgResponseTime: "1.5h"
    },
    {
      messageType: "Final (Día de Cita)",
      sent: 74,
      confirmed: 65,
      confirmationRate: 87.8,
      avgResponseTime: "0.8h"
    }
  ];

  const byTimeOfDay = [
    { time: "06:00 - 09:00", sent: 234, confirmed: 189, rate: 80.8 },
    { time: "09:00 - 12:00", sent: 856, confirmed: 678, rate: 79.2 },
    { time: "12:00 - 15:00", sent: 645, confirmed: 487, rate: 75.5 },
    { time: "15:00 - 18:00", sent: 723, confirmed: 534, rate: 73.9 },
    { time: "18:00 - 21:00", sent: 122, confirmed: 99, rate: 81.1 }
  ];

  const comparison = {
    withReminders: {
      label: "Con Recordatorios",
      confirmationRate: 77.0,
      attendanceRate: 84.5,
      noShowRate: 15.5
    },
    withoutReminders: {
      label: "Sin Recordatorios (Histórico)",
      confirmationRate: 45.0,
      attendanceRate: 62.0,
      noShowRate: 38.0
    },
    improvement: {
      confirmation: "+32.0%",
      attendance: "+22.5%",
      noShow: "-22.5%"
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Efectividad de Recordatorios</h1>
        <p className="text-gray-400">Análisis del impacto de los recordatorios en la confirmación y asistencia</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa Confirmación</p>
                <p className="text-3xl font-bold text-green-500">{overallStats.confirmationRate}%</p>
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {overallStats.improvement}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa Asistencia</p>
                <p className="text-3xl font-bold text-blue-500">{overallStats.attendanceRate}%</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa No-Show</p>
                <p className="text-3xl font-bold text-red-500">{overallStats.noShowRate}%</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tiempo Resp. Promedio</p>
                <p className="text-3xl font-bold text-white">{overallStats.avgResponseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison: With vs Without Reminders */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-500" />
            Comparación: Con vs. Sin Recordatorios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Confirmation Rate */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Tasa de Confirmación</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{comparison.withReminders.label}</span>
                    <span className="text-sm font-bold text-green-500">
                      {comparison.withReminders.confirmationRate}%
                    </span>
                  </div>
                  <Progress value={comparison.withReminders.confirmationRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{comparison.withoutReminders.label}</span>
                    <span className="text-sm font-bold text-red-500">
                      {comparison.withoutReminders.confirmationRate}%
                    </span>
                  </div>
                  <Progress value={comparison.withoutReminders.confirmationRate} className="h-2" />
                </div>
                <div className="bg-green-500/10 border border-green-500 p-3 rounded-lg">
                  <p className="text-xs text-green-500 mb-1">Mejora</p>
                  <p className="text-xl font-bold text-green-500">{comparison.improvement.confirmation}</p>
                </div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Tasa de Asistencia</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{comparison.withReminders.label}</span>
                    <span className="text-sm font-bold text-blue-500">
                      {comparison.withReminders.attendanceRate}%
                    </span>
                  </div>
                  <Progress value={comparison.withReminders.attendanceRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{comparison.withoutReminders.label}</span>
                    <span className="text-sm font-bold text-red-500">
                      {comparison.withoutReminders.attendanceRate}%
                    </span>
                  </div>
                  <Progress value={comparison.withoutReminders.attendanceRate} className="h-2" />
                </div>
                <div className="bg-blue-500/10 border border-blue-500 p-3 rounded-lg">
                  <p className="text-xs text-blue-500 mb-1">Mejora</p>
                  <p className="text-xl font-bold text-blue-500">{comparison.improvement.attendance}</p>
                </div>
              </div>
            </div>

            {/* No-Show Rate */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Tasa de No-Show</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{comparison.withReminders.label}</span>
                    <span className="text-sm font-bold text-green-500">
                      {comparison.withReminders.noShowRate}%
                    </span>
                  </div>
                  <Progress value={comparison.withReminders.noShowRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{comparison.withoutReminders.label}</span>
                    <span className="text-sm font-bold text-red-500">
                      {comparison.withoutReminders.noShowRate}%
                    </span>
                  </div>
                  <Progress value={comparison.withoutReminders.noShowRate} className="h-2" />
                </div>
                <div className="bg-green-500/10 border border-green-500 p-3 rounded-lg">
                  <p className="text-xs text-green-500 mb-1">Reducción</p>
                  <p className="text-xl font-bold text-green-500">{comparison.improvement.noShow}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Appointment Type */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Efectividad por Tipo de Cita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {byType.map((item, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-white">{item.type}</h3>
                    <Badge className={item.trend === "up" ? "bg-green-500" : "bg-red-500"}>
                      {item.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {item.improvement}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Tasa Confirmación</p>
                    <p className="text-2xl font-bold text-green-500">{item.stats.confirmationRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Recordatorios</p>
                    <p className="text-lg font-semibold text-white">{item.stats.totalReminders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Confirmados</p>
                    <p className="text-lg font-semibold text-green-500">{item.stats.confirmed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">No Confirmados</p>
                    <p className="text-lg font-semibold text-red-500">{item.stats.notConfirmed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tasa Asistencia</p>
                    <p className="text-lg font-semibold text-blue-500">{item.stats.attendanceRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tiempo Resp.</p>
                    <p className="text-lg font-semibold text-white">{item.stats.avgResponseTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Message Type */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Efectividad por Tipo de Mensaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {byMessage.map((item, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white mb-2">{item.messageType}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Enviados</p>
                        <p className="text-sm font-semibold text-white">{item.sent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Confirmados</p>
                        <p className="text-sm font-semibold text-green-500">{item.confirmed}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tiempo Resp.</p>
                        <p className="text-sm font-semibold text-white">{item.avgResponseTime}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-xs text-gray-400 mb-1">Tasa</p>
                    <p className="text-2xl font-bold text-green-500">{item.confirmationRate}%</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={item.confirmationRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Time of Day */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Efectividad por Horario de Envío</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {byTimeOfDay.map((item, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-white">{item.time}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-xs text-gray-400">Enviados: </span>
                      <span className="text-sm font-semibold text-white">{item.sent}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Confirmados: </span>
                      <span className="text-sm font-semibold text-green-500">{item.confirmed}</span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-green-500">{item.rate}%</span>
                    </div>
                  </div>
                </div>
                <Progress value={item.rate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-blue-500/10 border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-500 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Insights Clave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-white">
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span>Los recordatorios han mejorado la tasa de confirmación en un <strong>32%</strong> comparado con el período sin recordatorios.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span>El mensaje "Final (Día de Cita)" tiene la mayor efectividad con <strong>87.8%</strong> de confirmación.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span>Los mejores horarios para enviar recordatorios son entre <strong>06:00-09:00</strong> y <strong>18:00-21:00</strong>.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span>Las citas de ortodoncia tienen una tasa de confirmación <strong>5.7%</strong> mayor que las de clínico general.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
