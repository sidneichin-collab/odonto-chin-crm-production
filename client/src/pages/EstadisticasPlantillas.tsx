import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  TrendingUp, 
  Eye,
  MessageSquare,
  CheckCircle2,
  Send,
  Clock,
  Users,
  BarChart3,
  Edit,
  Copy,
  Trash2
} from "lucide-react";

export default function EstadisticasPlantillas() {
  const [selectedType, setSelectedType] = useState("all");

  // Mock data - será substituído por dados reais do backend
  const templates = [
    {
      id: 1,
      name: "Recordatorio Ortodoncia - Primera Vez",
      type: "ortodoncia",
      category: "recordatorio",
      content: "Hola {{nombre}} 😊 Te escribimos desde ORTOBOM ODONTOLOGÍA. Queremos recordarte tu cita de mantenimiento de ortodoncia con la Dra, el día {{fecha}} a las {{hora}}...",
      stats: {
        sent: 1234,
        delivered: 1220,
        read: 1050,
        replied: 789,
        deliveryRate: 98.9,
        readRate: 86.1,
        replyRate: 75.1,
        avgResponseTime: "N/A",
        confirmations: 789,
        confirmationRate: 63.9
      },
      performance: "excellent",
      lastUsed: "Hoy, 10:30 AM",
      createdAt: "15/01/2026"
    },
    {
      id: 2,
      name: "Recordatorio Ortodoncia - Seguimiento 1",
      type: "ortodoncia",
      category: "recordatorio",
      content: "Hola {{nombre}}, aún no hemos recibido tu confirmación. Mantener las citas al día es fundamental para que tus dientes se alineen más rápido...",
      stats: {
        sent: 456,
        delivered: 450,
        read: 380,
        replied: 320,
        deliveryRate: 98.7,
        readRate: 84.4,
        replyRate: 84.2,
        avgResponseTime: "N/A",
        confirmations: 320,
        confirmationRate: 70.2
      },
      performance: "good",
      lastUsed: "Hoy, 15:00 PM",
      createdAt: "15/01/2026"
    },
    {
      id: 3,
      name: "Recordatorio Ortodoncia - Final (Día de la Cita)",
      type: "ortodoncia",
      category: "recordatorio",
      content: "{{nombre}}, este es un aviso final de ORTOBOM ODONTOLOGÍA. Tu cita de mantenimiento de ortodoncia con la Dra. está programada para hoy {{fecha}} a las {{hora}}...",
      stats: {
        sent: 89,
        delivered: 88,
        read: 85,
        replied: 78,
        deliveryRate: 98.9,
        readRate: 96.6,
        replyRate: 91.8,
        avgResponseTime: "N/A",
        confirmations: 78,
        confirmationRate: 87.6
      },
      performance: "excellent",
      lastUsed: "Hoy, 06:30 AM",
      createdAt: "15/01/2026"
    },
    {
      id: 4,
      name: "Recordatorio Clínico General",
      type: "clinico_general",
      category: "recordatorio",
      content: "Hola {{nombre}} 😊 Te recordamos tu cita con el Dr. {{doctor}} el día {{fecha}} a las {{hora}}. Por favor confirma tu asistencia...",
      stats: {
        sent: 567,
        delivered: 560,
        read: 480,
        replied: 398,
        deliveryRate: 98.8,
        readRate: 85.7,
        replyRate: 82.9,
        avgResponseTime: "N/A",
        confirmations: 398,
        confirmationRate: 70.2
      },
      performance: "good",
      lastUsed: "Ayer, 10:00 AM",
      createdAt: "15/01/2026"
    },
    {
      id: 5,
      name: "Post-Consulta Agradecimiento",
      type: "post_consulta",
      category: "seguimiento",
      content: "Hola {{nombre}} 😊 Gracias por tu visita hoy. La Dra. {{doctor}} espera que hayas tenido una excelente experiencia...",
      stats: {
        sent: 234,
        delivered: 232,
        read: 195,
        replied: 89,
        deliveryRate: 99.1,
        readRate: 84.1,
        replyRate: 45.6,
        avgResponseTime: "4.5 min",
        confirmations: 0,
        confirmationRate: 0
      },
      performance: "average",
      lastUsed: "Hoy, 18:00 PM",
      createdAt: "15/01/2026"
    }
  ];

  const filteredTemplates = templates.filter(t => {
    if (selectedType === "all") return true;
    return t.type === selectedType;
  });

  const globalStats = {
    totalTemplates: templates.length,
    totalSent: templates.reduce((acc, t) => acc + t.stats.sent, 0),
    avgDeliveryRate: (templates.reduce((acc, t) => acc + t.stats.deliveryRate, 0) / templates.length).toFixed(1),
    avgReadRate: (templates.reduce((acc, t) => acc + t.stats.readRate, 0) / templates.length).toFixed(1),
    avgReplyRate: (templates.reduce((acc, t) => acc + t.stats.replyRate, 0) / templates.length).toFixed(1)
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "average": return "bg-yellow-500";
      case "poor": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getPerformanceLabel = (performance: string) => {
    switch (performance) {
      case "excellent": return "Excelente";
      case "good": return "Bueno";
      case "average": return "Promedio";
      case "poor": return "Bajo";
      default: return "N/A";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Estadísticas de Plantillas</h1>
        <p className="text-gray-400">Performance y análisis de todas las plantillas de mensajes</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Plantillas</p>
                <p className="text-2xl font-bold text-white">{globalStats.totalTemplates}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Mensajes Enviados</p>
                <p className="text-2xl font-bold text-white">{globalStats.totalSent}</p>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa Entrega</p>
                <p className="text-2xl font-bold text-white">{globalStats.avgDeliveryRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa Lectura</p>
                <p className="text-2xl font-bold text-white">{globalStats.avgReadRate}%</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa Respuesta</p>
                <p className="text-2xl font-bold text-white">{globalStats.avgReplyRate}%</p>
              </div>
              <MessageSquare className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={selectedType === "all" ? "default" : "outline"}
                onClick={() => setSelectedType("all")}
                className={selectedType === "all" ? "bg-blue-600" : ""}
              >
                Todas
              </Button>
              <Button
                size="sm"
                variant={selectedType === "ortodoncia" ? "default" : "outline"}
                onClick={() => setSelectedType("ortodoncia")}
                className={selectedType === "ortodoncia" ? "bg-blue-600" : ""}
              >
                Ortodoncia
              </Button>
              <Button
                size="sm"
                variant={selectedType === "clinico_general" ? "default" : "outline"}
                onClick={() => setSelectedType("clinico_general")}
                className={selectedType === "clinico_general" ? "bg-blue-600" : ""}
              >
                Clínico General
              </Button>
              <Button
                size="sm"
                variant={selectedType === "post_consulta" ? "default" : "outline"}
                onClick={() => setSelectedType("post_consulta")}
                className={selectedType === "post_consulta" ? "bg-blue-600" : ""}
              >
                Post-Consulta
              </Button>
            </div>

            <Button className="bg-green-600 hover:bg-green-700">
              <FileText className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-white">{template.name}</CardTitle>
                    <p className="text-sm text-gray-400">Última vez usado: {template.lastUsed}</p>
                  </div>
                  <Badge className={getPerformanceColor(template.performance)}>
                    {getPerformanceLabel(template.performance)}
                  </Badge>
                  <Badge variant="outline">
                    {template.type === "ortodoncia" ? "Ortodoncia" : 
                     template.type === "clinico_general" ? "Clínico General" : 
                     "Post-Consulta"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-600 text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Template Content */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Contenido de la Plantilla</h3>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Mensajes Enviados</p>
                      <p className="text-xl font-bold text-white">{template.stats.sent}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Creado</p>
                      <p className="text-sm font-semibold text-white">{template.createdAt}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Statistics */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Estadísticas de Performance</h3>
                  <div className="space-y-4">
                    {/* Delivery Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Tasa de Entrega
                        </span>
                        <span className="text-sm font-semibold text-green-500">
                          {template.stats.deliveryRate}%
                        </span>
                      </div>
                      <Progress value={template.stats.deliveryRate} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {template.stats.delivered} de {template.stats.sent} entregados
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
                          {template.stats.readRate}%
                        </span>
                      </div>
                      <Progress value={template.stats.readRate} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {template.stats.read} de {template.stats.delivered} leídos
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
                          {template.stats.replyRate}%
                        </span>
                      </div>
                      <Progress value={template.stats.replyRate} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {template.stats.replied} respuestas recibidas
                      </p>
                    </div>

                    {/* Confirmation Rate (for recordatorios) */}
                    {template.category === "recordatorio" && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400 flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Tasa de Confirmación
                          </span>
                          <span className="text-sm font-semibold text-cyan-500">
                            {template.stats.confirmationRate}%
                          </span>
                        </div>
                        <Progress value={template.stats.confirmationRate} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {template.stats.confirmations} confirmaciones
                        </p>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Tiempo Resp.</p>
                        <p className="text-sm font-semibold text-white flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {template.stats.avgResponseTime}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Performance</p>
                        <Badge className={getPerformanceColor(template.performance)}>
                          {getPerformanceLabel(template.performance)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
