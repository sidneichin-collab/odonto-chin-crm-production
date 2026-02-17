import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Trophy,
  BarChart3,
  Plus
} from "lucide-react";

export default function TestsAB() {
  const [selectedStatus, setSelectedStatus] = useState("active");

  // Mock data - será substituído por dados reais do backend
  const tests = [
    {
      id: 1,
      name: "Test Recordatorio Ortodoncia - Tono",
      description: "Comparación entre tono amigable vs. tono urgente en recordatorios",
      status: "active",
      startDate: "01/02/2026",
      endDate: "15/02/2026",
      progress: 65,
      variants: [
        {
          id: "A",
          name: "Versión A - Tono Amigable",
          content: "Hola {{nombre}} 😊 Te escribimos desde ORTOBOM ODONTOLOGÍA. Queremos recordarte tu cita de mantenimiento de ortodoncia con la Dra, el día {{fecha}} a las {{hora}}. Mantener las citas al día es fundamental para que tus dientes se alineen más rápido y de forma correcta. Por favor, confirma tu asistencia respondiendo solo SÍ.",
          stats: {
            sent: 523,
            delivered: 518,
            read: 445,
            replied: 356,
            deliveryRate: 99.0,
            readRate: 85.9,
            replyRate: 80.0,
            confirmations: 356,
            confirmationRate: 68.1
          },
          isWinner: false
        },
        {
          id: "B",
          name: "Versión B - Tono Urgente",
          content: "{{nombre}}, IMPORTANTE: Tu cita de ortodoncia con la Dra. está programada para {{fecha}} a las {{hora}}. La inasistencia sin confirmación compromete el avance de tu tratamiento. Confirma AHORA respondiendo SÍ.",
          stats: {
            sent: 511,
            delivered: 505,
            read: 438,
            replied: 389,
            deliveryRate: 98.8,
            readRate: 86.7,
            replyRate: 88.8,
            confirmations: 389,
            confirmationRate: 76.1
          },
          isWinner: true
        }
      ],
      winner: "B",
      improvement: "+8.0%",
      confidence: 95
    },
    {
      id: 2,
      name: "Test Horario de Envío",
      description: "Comparación entre envío a las 9:00 AM vs. 3:00 PM",
      status: "active",
      startDate: "03/02/2026",
      endDate: "17/02/2026",
      progress: 45,
      variants: [
        {
          id: "A",
          name: "Versión A - 9:00 AM",
          content: "Mismo mensaje enviado a las 9:00 AM",
          stats: {
            sent: 234,
            delivered: 232,
            read: 198,
            replied: 156,
            deliveryRate: 99.1,
            readRate: 85.3,
            replyRate: 78.8,
            confirmations: 156,
            confirmationRate: 66.7
          },
          isWinner: true
        },
        {
          id: "B",
          name: "Versión B - 3:00 PM",
          content: "Mismo mensaje enviado a las 3:00 PM",
          stats: {
            sent: 228,
            delivered: 225,
            read: 185,
            replied: 138,
            deliveryRate: 98.7,
            readRate: 82.2,
            replyRate: 74.6,
            confirmations: 138,
            confirmationRate: 60.5
          },
          isWinner: false
        }
      ],
      winner: "A",
      improvement: "+6.2%",
      confidence: 89
    },
    {
      id: 3,
      name: "Test Emoji vs. Sin Emoji",
      description: "Impacto de emojis en la tasa de respuesta",
      status: "completed",
      startDate: "15/01/2026",
      endDate: "31/01/2026",
      progress: 100,
      variants: [
        {
          id: "A",
          name: "Versión A - Con Emoji",
          content: "Hola {{nombre}} 😊 Te recordamos tu cita...",
          stats: {
            sent: 1045,
            delivered: 1038,
            read: 892,
            replied: 723,
            deliveryRate: 99.3,
            readRate: 85.9,
            replyRate: 81.1,
            confirmations: 723,
            confirmationRate: 69.2
          },
          isWinner: true
        },
        {
          id: "B",
          name: "Versión B - Sin Emoji",
          content: "Hola {{nombre}}. Te recordamos tu cita...",
          stats: {
            sent: 1052,
            delivered: 1045,
            read: 878,
            replied: 689,
            deliveryRate: 99.3,
            readRate: 84.0,
            replyRate: 78.5,
            confirmations: 689,
            confirmationRate: 65.5
          },
          isWinner: false
        }
      ],
      winner: "A",
      improvement: "+3.7%",
      confidence: 98
    }
  ];

  const filteredTests = tests.filter(t => {
    if (selectedStatus === "all") return true;
    return t.status === selectedStatus;
  });

  const stats = {
    totalTests: tests.length,
    activeTests: tests.filter(t => t.status === "active").length,
    completedTests: tests.filter(t => t.status === "completed").length,
    avgImprovement: "+5.9%"
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "paused": return "bg-yellow-500";
      case "draft": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Activo";
      case "completed": return "Completado";
      case "paused": return "Pausado";
      case "draft": return "Borrador";
      default: return "Desconocido";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-green-500";
    if (confidence >= 80) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tests A/B</h1>
          <p className="text-gray-400">Optimiza tus mensajes con pruebas A/B basadas en datos</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Test A/B
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Tests</p>
                <p className="text-2xl font-bold text-white">{stats.totalTests}</p>
              </div>
              <FlaskConical className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tests Activos</p>
                <p className="text-2xl font-bold text-white">{stats.activeTests}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completados</p>
                <p className="text-2xl font-bold text-white">{stats.completedTests}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Mejora Promedio</p>
                <p className="text-2xl font-bold text-green-500">{stats.avgImprovement}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
              className={selectedStatus === "all" ? "bg-blue-600" : ""}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === "active" ? "default" : "outline"}
              onClick={() => setSelectedStatus("active")}
              className={selectedStatus === "active" ? "bg-blue-600" : ""}
            >
              Activos
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === "completed" ? "default" : "outline"}
              onClick={() => setSelectedStatus("completed")}
              className={selectedStatus === "completed" ? "bg-blue-600" : ""}
            >
              Completados
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === "paused" ? "default" : "outline"}
              onClick={() => setSelectedStatus("paused")}
              className={selectedStatus === "paused" ? "bg-blue-600" : ""}
            >
              Pausados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      <div className="space-y-6">
        {filteredTests.map((test) => (
          <Card key={test.id} className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FlaskConical className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-white">{test.name}</CardTitle>
                    <p className="text-sm text-gray-400">{test.description}</p>
                  </div>
                  <Badge className={getStatusColor(test.status)}>
                    {getStatusLabel(test.status)}
                  </Badge>
                  {test.winner && (
                    <Badge className="bg-yellow-500">
                      <Trophy className="h-3 w-3 mr-1" />
                      Ganador: Versión {test.winner}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {test.status === "active" && (
                    <>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-600 text-red-600">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Test Info */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Fecha Inicio</p>
                  <p className="text-sm font-semibold text-white">{test.startDate}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Fecha Fin</p>
                  <p className="text-sm font-semibold text-white">{test.endDate}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Progreso</p>
                  <p className="text-sm font-semibold text-white">{test.progress}%</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Confianza</p>
                  <p className={`text-sm font-semibold ${getConfidenceColor(test.confidence)}`}>
                    {test.confidence}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <Progress value={test.progress} className="h-2" />
              </div>

              {/* Variants Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {test.variants.map((variant) => (
                  <div key={variant.id} className={`border-2 rounded-lg p-4 ${
                    variant.isWinner ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{variant.name}</h3>
                      {variant.isWinner && (
                        <Badge className="bg-yellow-500">
                          <Trophy className="h-3 w-3 mr-1" />
                          Ganador
                        </Badge>
                      )}
                    </div>

                    {/* Content Preview */}
                    <div className="bg-gray-800 p-3 rounded-lg mb-4">
                      <p className="text-xs text-gray-400 mb-2">Vista Previa</p>
                      <p className="text-sm text-gray-300 line-clamp-3">{variant.content}</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Enviados</span>
                          <span className="text-xs font-semibold text-white">{variant.stats.sent}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400 flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Tasa Entrega
                          </span>
                          <span className="text-xs font-semibold text-green-500">
                            {variant.stats.deliveryRate}%
                          </span>
                        </div>
                        <Progress value={variant.stats.deliveryRate} className="h-1" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400 flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            Tasa Lectura
                          </span>
                          <span className="text-xs font-semibold text-blue-500">
                            {variant.stats.readRate}%
                          </span>
                        </div>
                        <Progress value={variant.stats.readRate} className="h-1" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400 flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Tasa Respuesta
                          </span>
                          <span className="text-xs font-semibold text-purple-500">
                            {variant.stats.replyRate}%
                          </span>
                        </div>
                        <Progress value={variant.stats.replyRate} className="h-1" />
                      </div>

                      <div className="pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Tasa Confirmación</span>
                          <span className={`text-sm font-bold ${
                            variant.isWinner ? 'text-yellow-500' : 'text-white'
                          }`}>
                            {variant.stats.confirmationRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Results Summary */}
              {test.status === "completed" && (
                <div className="mt-6 bg-green-500/10 border border-green-500 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-500 mb-1">
                        Resultado del Test
                      </p>
                      <p className="text-sm text-white">
                        La Versión {test.winner} obtuvo una mejora de <span className="font-bold">{test.improvement}</span> en la tasa de confirmación con un nivel de confianza del <span className="font-bold">{test.confidence}%</span>
                      </p>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Aplicar Ganador
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
