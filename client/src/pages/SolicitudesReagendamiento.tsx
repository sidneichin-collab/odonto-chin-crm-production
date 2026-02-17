import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter
} from "lucide-react";

export default function SolicitudesReagendamiento() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Mock data - será substituído por dados reais do backend
  const requests = [
    {
      id: 1,
      patientName: "María González",
      patientPhone: "+591 7654-3210",
      originalDate: "08/02/2026",
      originalTime: "14:00",
      requestDate: "07/02/2026 10:30",
      reason: "Necesito reagendar mi cita para mañana",
      status: "pending", // pending, resolved, cancelled
      priority: "high", // high, medium, low
      channel: "recordatorios",
      appointmentType: "Mantenimiento Ortodoncia"
    },
    {
      id: 2,
      patientName: "Carlos Rodríguez",
      patientPhone: "+591 7654-3213",
      originalDate: "07/02/2026",
      originalTime: "15:00",
      requestDate: "07/02/2026 07:00",
      reason: "No puedo asistir hoy",
      status: "pending",
      priority: "urgent", // urgent because it's for today
      channel: "recordatorios",
      appointmentType: "Mantenimiento Ortodoncia"
    },
    {
      id: 3,
      patientName: "Ana Silva",
      patientPhone: "+591 7654-3214",
      originalDate: "10/02/2026",
      originalTime: "10:00",
      requestDate: "06/02/2026 16:45",
      reason: "Tengo un viaje de trabajo",
      status: "resolved",
      priority: "medium",
      channel: "clinic",
      appointmentType: "Consulta General",
      resolvedDate: "06/02/2026 17:30",
      newDate: "15/02/2026",
      newTime: "11:00"
    },
    {
      id: 4,
      patientName: "Pedro Martínez",
      patientPhone: "+591 7654-3215",
      originalDate: "09/02/2026",
      originalTime: "16:00",
      requestDate: "05/02/2026 14:20",
      reason: "Problemas de salud",
      status: "cancelled",
      priority: "low",
      channel: "clinic",
      appointmentType: "Evaluación Ortodoncia"
    }
  ];

  const filteredRequests = requests.filter(req => {
    // Filtro por status
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    
    // Filtro por busca
    if (searchQuery && !req.patientName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    resolved: requests.filter(r => r.status === "resolved").length,
    urgent: requests.filter(r => r.priority === "urgent").length
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendiente";
      case "resolved": return "Resuelto";
      case "cancelled": return "Cancelado";
      default: return "Desconocido";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Solicitudes de Reagendamiento</h1>
        <p className="text-gray-400">Gestiona todas las solicitudes de reagendamiento de pacientes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Solicitudes</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Resueltas</p>
                <p className="text-2xl font-bold text-white">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Urgentes</p>
                <p className="text-2xl font-bold text-white">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
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
                placeholder="Buscar por nombre de paciente..."
                className="pl-10 bg-gray-800 border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                className={statusFilter === "all" ? "bg-blue-600" : ""}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                className={statusFilter === "pending" ? "bg-blue-600" : ""}
              >
                Pendientes
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "resolved" ? "default" : "outline"}
                onClick={() => setStatusFilter("resolved")}
                className={statusFilter === "resolved" ? "bg-blue-600" : ""}
              >
                Resueltas
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                onClick={() => setStatusFilter("cancelled")}
                className={statusFilter === "cancelled" ? "bg-blue-600" : ""}
              >
                Canceladas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                {/* Patient Info */}
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{request.patientName}</h3>
                      <Badge className={getPriorityColor(request.priority)}>
                        {getPriorityLabel(request.priority)}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                      <Badge className={request.channel === "clinic" ? "bg-green-500" : "bg-purple-500"}>
                        {request.channel === "clinic" ? "Canal Clínica" : "Canal Recordatorios"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Teléfono</p>
                        <p className="text-sm text-white flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {request.patientPhone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tipo de Cita</p>
                        <p className="text-sm text-white">{request.appointmentType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Cita Original</p>
                        <p className="text-sm text-white flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {request.originalDate} a las {request.originalTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Fecha de Solicitud</p>
                        <p className="text-sm text-white flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {request.requestDate}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-400 mb-1">Motivo</p>
                      <p className="text-sm text-white flex items-center">
                        <MessageSquare className="h-3 w-3 mr-2" />
                        "{request.reason}"
                      </p>
                    </div>

                    {request.status === "resolved" && (
                      <div className="bg-green-500/10 border border-green-500 p-3 rounded-lg">
                        <p className="text-xs text-green-500 mb-1">Nueva Cita Agendada</p>
                        <p className="text-sm text-white">
                          {request.newDate} a las {request.newTime}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Resuelto el {request.resolvedDate}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {request.status === "pending" && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Phone className="h-4 w-4 mr-2" />
                      Contactar
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar Resuelto
                    </Button>
                    <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-700 hover:text-white">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-gray-400">No se encontraron solicitudes de reagendamiento</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
