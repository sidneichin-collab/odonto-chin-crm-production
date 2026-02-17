import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Clock,
  Award
} from "lucide-react";

export default function InsightsIA() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data - será substituído por dados reais do backend com IA
  const insights = [
    {
      id: 1,
      category: "performance",
      priority: "high",
      title: "Tasa de Confirmación en Ortodoncia Aumentó Significativamente",
      description: "La tasa de confirmación de citas de ortodoncia ha aumentado un 12% en los últimos 7 días, superando el promedio histórico.",
      impact: "positive",
      confidence: 95,
      metrics: {
        current: "80.0%",
        previous: "68.0%",
        change: "+12.0%"
      },
      recommendation: "Continuar usando el mensaje 'Final (Día de Cita)' que ha mostrado la mayor efectividad (87.8% de confirmación).",
      action: "Mantener estrategia actual",
      timestamp: "Hoy, 09:30 AM"
    },
    {
      id: 2,
      category: "risk",
      priority: "urgent",
      title: "Aumento de No-Shows en Citas de Tarde",
      description: "Se detectó un aumento del 8% en la tasa de no-show para citas programadas entre 15:00-18:00 en los últimos 3 días.",
      impact: "negative",
      confidence: 89,
      metrics: {
        current: "22.5%",
        previous: "14.5%",
        change: "+8.0%"
      },
      recommendation: "Enviar un recordatorio adicional 2 horas antes de la cita para este horario específico.",
      action: "Implementar recordatorio extra",
      timestamp: "Hoy, 08:15 AM"
    },
    {
      id: 3,
      category: "optimization",
      priority: "medium",
      title: "Horario Óptimo para Recordatorios Identificado",
      description: "Los mensajes enviados entre 06:00-09:00 tienen una tasa de confirmación 6.2% mayor que otros horarios.",
      impact: "positive",
      confidence: 92,
      metrics: {
        current: "80.8%",
        previous: "74.6%",
        change: "+6.2%"
      },
      recommendation: "Programar el envío de recordatorios principales en este horario para maximizar la tasa de respuesta.",
      action: "Ajustar horarios de envío",
      timestamp: "Ayer, 18:45 PM"
    },
    {
      id: 4,
      category: "channel",
      priority: "high",
      title: "Canal de Recordatorios Cerca del Límite Diario",
      description: "El canal de recordatorios ha enviado 847 de 1000 mensajes permitidos hoy (84.7% del límite).",
      impact: "warning",
      confidence: 100,
      metrics: {
        current: "847",
        limit: "1000",
        percentage: "84.7%"
      },
      recommendation: "Considerar activar el canal de respaldo o distribuir mensajes entre múltiples canales para evitar alcanzar el límite.",
      action: "Activar canal de respaldo",
      timestamp: "Hoy, 16:30 PM"
    },
    {
      id: 5,
      category: "engagement",
      priority: "medium",
      title: "Pacientes con Bajo Engagement Identificados",
      description: "15 pacientes no han respondido a los últimos 3 recordatorios consecutivos. Alto riesgo de no-show.",
      impact: "negative",
      confidence: 87,
      metrics: {
        count: "15",
        percentage: "5.8%",
        avgNoResponse: "3 mensajes"
      },
      recommendation: "Contactar estos pacientes por teléfono o cambiar el canal de comunicación (ej: SMS o email).",
      action: "Contacto directo recomendado",
      timestamp: "Hoy, 10:00 AM"
    },
    {
      id: 6,
      category: "performance",
      priority: "low",
      title: "Tasa de Lectura Estable en Ambos Canales",
      description: "La tasa de lectura se mantiene estable en 85-86% en ambos canales (Clínica y Recordatorios).",
      impact: "neutral",
      confidence: 94,
      metrics: {
        clinica: "85.3%",
        recordatorios: "86.2%",
        change: "+0.9%"
      },
      recommendation: "Mantener la calidad actual de los mensajes. No se requieren cambios inmediatos.",
      action: "Sin acción requerida",
      timestamp: "Ayer, 14:20 PM"
    },
    {
      id: 7,
      category: "opportunity",
      priority: "medium",
      title: "Oportunidad de Mejora en Mensajes de Clínico General",
      description: "Los mensajes de clínico general tienen 5.7% menos tasa de confirmación que ortodoncia. Posible mejora con personalización.",
      impact: "opportunity",
      confidence: 91,
      metrics: {
        ortodoncia: "80.0%",
        clinico: "74.3%",
        gap: "-5.7%"
      },
      recommendation: "Aplicar técnicas de persuasión similares a las de ortodoncia en mensajes de clínico general.",
      action: "Crear test A/B",
      timestamp: "Ayer, 11:30 AM"
    }
  ];

  const filteredInsights = insights.filter(i => {
    if (selectedCategory === "all") return true;
    return i.category === selectedCategory;
  });

  const stats = {
    totalInsights: insights.length,
    urgent: insights.filter(i => i.priority === "urgent").length,
    high: insights.filter(i => i.priority === "high").length,
    opportunities: insights.filter(i => i.category === "opportunity").length
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "Urgente";
      case "high": return "Alta";
      case "medium": return "Media";
      case "low": return "Baja";
      default: return "Normal";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "positive":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "negative":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "opportunity":
        return <Target className="h-5 w-5 text-blue-500" />;
      case "neutral":
        return <BarChart3 className="h-5 w-5 text-gray-500" />;
      default:
        return <Brain className="h-5 w-5 text-purple-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
        return <BarChart3 className="h-4 w-4" />;
      case "risk":
        return <AlertTriangle className="h-4 w-4" />;
      case "optimization":
        return <Target className="h-4 w-4" />;
      case "channel":
        return <MessageSquare className="h-4 w-4" />;
      case "engagement":
        return <Users className="h-4 w-4" />;
      case "opportunity":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "performance": return "Performance";
      case "risk": return "Riesgo";
      case "optimization": return "Optimización";
      case "channel": return "Canal";
      case "engagement": return "Engagement";
      case "opportunity": return "Oportunidad";
      default: return "General";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-500" />
            Insights e Recomendaciones IA
          </h1>
          <p className="text-gray-400">Análisis inteligente y recomendaciones automáticas para optimizar tu CRM</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Sparkles className="h-4 w-4 mr-2" />
          Generar Nuevos Insights
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Insights</p>
                <p className="text-2xl font-bold text-white">{stats.totalInsights}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Urgentes</p>
                <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Alta Prioridad</p>
                <p className="text-2xl font-bold text-orange-500">{stats.high}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Oportunidades</p>
                <p className="text-2xl font-bold text-blue-500">{stats.opportunities}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-blue-500" />
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
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-purple-600" : ""}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "performance" ? "default" : "outline"}
              onClick={() => setSelectedCategory("performance")}
              className={selectedCategory === "performance" ? "bg-purple-600" : ""}
            >
              Performance
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "risk" ? "default" : "outline"}
              onClick={() => setSelectedCategory("risk")}
              className={selectedCategory === "risk" ? "bg-purple-600" : ""}
            >
              Riesgos
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "optimization" ? "default" : "outline"}
              onClick={() => setSelectedCategory("optimization")}
              className={selectedCategory === "optimization" ? "bg-purple-600" : ""}
            >
              Optimización
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "opportunity" ? "default" : "outline"}
              onClick={() => setSelectedCategory("opportunity")}
              className={selectedCategory === "opportunity" ? "bg-purple-600" : ""}
            >
              Oportunidades
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <Card key={insight.id} className={`bg-gray-900 ${
            insight.priority === "urgent" ? "border-red-500 border-2" : 
            insight.priority === "high" ? "border-orange-500" : 
            "border-gray-800"
          }`}>
            <CardHeader className="border-b border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getImpactIcon(insight.impact)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-white">{insight.title}</CardTitle>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {getPriorityLabel(insight.priority)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getCategoryIcon(insight.category)}
                        <span>{getCategoryLabel(insight.category)}</span>
                      </Badge>
                      <Badge variant="outline" className="text-purple-500 border-purple-500">
                        <Brain className="h-3 w-3 mr-1" />
                        Confianza: {insight.confidence}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{insight.description}</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-500">{insight.timestamp}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metrics */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Métricas Clave
                  </h3>
                  <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                    {Object.entries(insight.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className={`text-sm font-semibold ${
                          typeof value === 'string' && value.startsWith('+') ? 'text-green-500' :
                          typeof value === 'string' && value.startsWith('-') ? 'text-red-500' :
                          'text-white'
                        }`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                    Recomendación
                  </h3>
                  <div className="bg-blue-500/10 border border-blue-500 p-4 rounded-lg">
                    <p className="text-sm text-white">{insight.recommendation}</p>
                  </div>
                </div>

                {/* Action */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-green-500" />
                    Acción Sugerida
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-white mb-2">{insight.action}</p>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aplicar Recomendación
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Summary */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-2 border-purple-500">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Award className="h-5 w-5 mr-2 text-purple-500" />
            Resumen Semanal de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-purple-400 mb-3">Logros Destacados</h3>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Tasa de confirmación aumentó <strong>12%</strong> en ortodoncia</span>
                </li>
                <li className="flex items-start text-sm text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Identificado horario óptimo de envío (<strong>06:00-09:00</strong>)</span>
                </li>
                <li className="flex items-start text-sm text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Tasa de lectura estable en <strong>85-86%</strong></span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-400 mb-3">Áreas de Atención</h3>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-white">
                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
                  <span>Aumento de no-shows en horario de tarde (<strong>+8%</strong>)</span>
                </li>
                <li className="flex items-start text-sm text-white">
                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
                  <span>Canal de recordatorios cerca del límite (<strong>84.7%</strong>)</span>
                </li>
                <li className="flex items-start text-sm text-white">
                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
                  <span><strong>15 pacientes</strong> con bajo engagement identificados</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
