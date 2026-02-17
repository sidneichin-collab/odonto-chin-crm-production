import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  Star
} from "lucide-react";

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data - será substituído por dados reais do backend
  const templates = [
    {
      id: 1,
      name: "Primera Vez (Amigable)",
      category: "reminder",
      appointmentType: "all",
      message: "Hola [Nombre], ¡Buen día! 😊\n\nTe recordamos tu cita con la Dra. en ORTOBOM ODONTOLOGÍA para el [Fecha] a las [Hora].\n\nPor favor, confirma tu asistencia respondiendo solo SÍ.\n\n¡Te esperamos!",
      variables: ["Nombre", "Fecha", "Hora", "Dra"],
      usageCount: 2580,
      confirmationRate: 64.1,
      lastUsed: "Hoy, 09:30 AM",
      status: "active",
      performance: "good"
    },
    {
      id: 2,
      name: "Seguimiento 1 (Educativo)",
      category: "reminder",
      appointmentType: "all",
      message: "[Nombre], este es un recordatorio de ORTOBOM ODONTOLOGÍA.\n\nTu cita con la Dra. está programada para [Fecha] a las [Hora].\n\nRecuerda que las citas de mantenimiento son fundamentales para el éxito de tu tratamiento. La Dra. ha planificado cuidadosamente tu agenda de atención.\n\nConfirma tu asistencia respondiendo solo SÍ.",
      variables: ["Nombre", "Fecha", "Hora", "Dra"],
      usageCount: 926,
      confirmationRate: 70.6,
      lastUsed: "Hoy, 08:15 AM",
      status: "active",
      performance: "excellent"
    },
    {
      id: 3,
      name: "Seguimiento 2 (Urgente)",
      category: "reminder",
      appointmentType: "all",
      message: "[Nombre], AVISO IMPORTANTE de ORTOBOM ODONTOLOGÍA.\n\nTu cita con la Dra. está programada para [Fecha] a las [Hora].\n\nNo hemos recibido tu confirmación. La inasistencia sin aviso previo compromete el avance de tu tratamiento y genera retrasos en tu agenda médica.\n\nConfirma AHORA tu asistencia respondiendo solo SÍ.",
      variables: ["Nombre", "Fecha", "Hora", "Dra"],
      usageCount: 272,
      confirmationRate: 72.8,
      lastUsed: "Hoy, 07:45 AM",
      status: "active",
      performance: "excellent"
    },
    {
      id: 4,
      name: "Final (Día de Cita)",
      category: "reminder",
      appointmentType: "orthodontics",
      message: "[Nombre], este es un aviso final de ORTOBOM ODONTOLOGÍA.\n\nTu cita de mantenimiento de ortodoncia con la Dra. está programada para hoy [Fecha] a las [Hora].\n\nLa inasistencia sin confirmación compromete el avance de tu tratamiento, genera retrasos y afecta directamente el resultado del alineamiento dental planificado por la Dra.\n\nLa agenda médica es organizada con antelación y tu horario está reservado exclusivamente para ti.\n\nConfirma de inmediato tu asistencia respondiendo solo SÍ.",
      variables: ["Nombre", "Fecha", "Hora", "Dra"],
      usageCount: 74,
      confirmationRate: 87.8,
      lastUsed: "Hoy, 06:30 AM",
      status: "active",
      performance: "excellent"
    },
    {
      id: 5,
      name: "Agradecimiento Post-Cita",
      category: "followup",
      appointmentType: "all",
      message: "Hola [Nombre], ¡Gracias por visitarnos! 😊\n\nEsperamos que tu experiencia en ORTOBOM ODONTOLOGÍA haya sido excelente.\n\nLa Dra. y todo nuestro equipo estamos comprometidos con tu salud dental.\n\n¿Cómo fue tu experiencia? Tu opinión es muy importante para nosotros.",
      variables: ["Nombre", "Dra"],
      usageCount: 1987,
      confirmationRate: 0,
      lastUsed: "Hoy, 18:00 PM",
      status: "active",
      performance: "good"
    },
    {
      id: 6,
      name: "Solicitud de Reagendamiento",
      category: "rescheduling",
      appointmentType: "all",
      message: "Hola [Nombre],\n\nEntendemos que a veces surgen imprevistos.\n\nNuestra secretaria te contactará en breve para reagendar tu cita con la Dra.\n\n¡Gracias por tu comprensión!",
      variables: ["Nombre", "Dra"],
      usageCount: 156,
      confirmationRate: 0,
      lastUsed: "Ayer, 16:30 PM",
      status: "active",
      performance: "good"
    },
    {
      id: 7,
      name: "Bienvenida Nuevo Paciente",
      category: "welcome",
      appointmentType: "all",
      message: "¡Bienvenido/a a ORTOBOM ODONTOLOGÍA, [Nombre]! 😊\n\nEstamos muy felices de que hayas elegido confiar en nosotros para el cuidado de tu salud dental.\n\nTu primera cita está programada para [Fecha] a las [Hora] con la Dra.\n\n¿Tienes alguna pregunta? Estamos aquí para ayudarte.",
      variables: ["Nombre", "Fecha", "Hora", "Dra"],
      usageCount: 234,
      confirmationRate: 0,
      lastUsed: "Ayer, 14:20 PM",
      status: "active",
      performance: "good"
    },
    {
      id: 8,
      name: "Campaña Promocional",
      category: "marketing",
      appointmentType: "all",
      message: "Hola [Nombre]! 🎉\n\n¡Tenemos una promoción especial para ti!\n\n[Descripción de la promoción]\n\nVálido hasta [Fecha de Vencimiento].\n\n¿Te interesa? Responde SÍ para más información.",
      variables: ["Nombre", "Descripción de la promoción", "Fecha de Vencimiento"],
      usageCount: 856,
      confirmationRate: 0,
      lastUsed: "Hace 3 días",
      status: "active",
      performance: "good"
    }
  ];

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.status === "active").length,
    reminder: templates.filter(t => t.category === "reminder").length,
    avgConfirmation: (templates.filter(t => t.confirmationRate > 0).reduce((acc, t) => acc + t.confirmationRate, 0) / templates.filter(t => t.confirmationRate > 0).length).toFixed(1)
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "reminder": return "Recordatorio";
      case "followup": return "Seguimiento";
      case "rescheduling": return "Reagendamiento";
      case "welcome": return "Bienvenida";
      case "marketing": return "Marketing";
      default: return "General";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "reminder": return "bg-blue-500";
      case "followup": return "bg-green-500";
      case "rescheduling": return "bg-yellow-500";
      case "welcome": return "bg-purple-500";
      case "marketing": return "bg-pink-500";
      default: return "bg-gray-500";
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "excellent": return "text-green-500";
      case "good": return "text-blue-500";
      case "average": return "text-yellow-500";
      case "poor": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getPerformanceLabel = (performance: string) => {
    switch (performance) {
      case "excellent": return "Excelente";
      case "good": return "Bueno";
      case "average": return "Regular";
      case "poor": return "Bajo";
      default: return "N/A";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Templates</h1>
          <p className="text-gray-400">Crea y administra plantillas de mensajes para tu CRM</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Templates</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Activos</p>
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Recordatorios</p>
                <p className="text-2xl font-bold text-white">{stats.reminder}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Confirmación Promedio</p>
                <p className="text-2xl font-bold text-white">{stats.avgConfirmation}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                className="pl-10 bg-gray-800 border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Button
                size="sm"
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className={selectedCategory === "all" ? "bg-blue-600" : ""}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === "reminder" ? "default" : "outline"}
                onClick={() => setSelectedCategory("reminder")}
                className={selectedCategory === "reminder" ? "bg-blue-600" : ""}
              >
                Recordatorios
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === "followup" ? "default" : "outline"}
                onClick={() => setSelectedCategory("followup")}
                className={selectedCategory === "followup" ? "bg-blue-600" : ""}
              >
                Seguimiento
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === "marketing" ? "default" : "outline"}
                onClick={() => setSelectedCategory("marketing")}
                className={selectedCategory === "marketing" ? "bg-blue-600" : ""}
              >
                Marketing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="bg-gray-900 border-gray-800 hover:border-blue-500 transition-colors">
            <CardHeader className="border-b border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-white">{template.name}</CardTitle>
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                    {template.confirmationRate > 80 && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Top
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {template.usageCount} usos
                    </span>
                    {template.confirmationRate > 0 && (
                      <span className="flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {template.confirmationRate}% confirmación
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {template.lastUsed}
                    </span>
                  </div>
                </div>
                <Badge className={getPerformanceColor(template.performance)} variant="outline">
                  {getPerformanceLabel(template.performance)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Message Preview */}
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <p className="text-xs text-gray-400 mb-2">Vista Previa:</p>
                <p className="text-sm text-white whitespace-pre-wrap line-clamp-4">{template.message}</p>
              </div>

              {/* Variables */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicar
                </Button>
                <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-700 hover:text-white">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-500 opacity-50" />
            <p className="text-gray-400">No se encontraron templates</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
