import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Search, 
  Filter,
  Send,
  Phone,
  User,
  Clock,
  CheckCheck,
  Archive,
  Star,
  MoreVertical,
  AlertCircle
} from "lucide-react";

export default function MensajesRecibidos() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - será substituído por dados reais do backend
  const conversations = [
    {
      id: 1,
      patientName: "María González",
      patientPhone: "+591 7654-3210",
      channel: "clinic", // clinic ou recordatorios
      lastMessage: "Hola, necesito reagendar mi cita para mañana",
      timestamp: "10:30 AM",
      unread: true,
      starred: false,
      needsAction: true, // Solicitud de reagendamiento detectada
      messages: [
        {
          id: 1,
          sender: "bot",
          text: "Hola María 😊 Te escribimos desde ORTOBOM ODONTOLOGÍA. Queremos recordarte tu cita de mantenimiento de ortodoncia con la Dra, el día 08/02/2026 a las 14:00. Por favor, confirma tu asistencia respondiendo solo SÍ.",
          timestamp: "10:15 AM",
          status: "delivered"
        },
        {
          id: 2,
          sender: "patient",
          text: "Hola, necesito reagendar mi cita para mañana",
          timestamp: "10:30 AM",
          status: "read"
        },
        {
          id: 3,
          sender: "bot",
          text: "Gracias por tu mensaje María. La secretaria te escribirá ahora para reagendarte. ¡Gracias!",
          timestamp: "10:30 AM",
          status: "delivered"
        }
      ]
    },
    {
      id: 2,
      patientName: "Juan Pérez",
      patientPhone: "+591 7654-3211",
      channel: "recordatorios",
      lastMessage: "Sí, confirmo mi cita",
      timestamp: "9:45 AM",
      unread: false,
      starred: true,
      needsAction: false,
      messages: [
        {
          id: 1,
          sender: "bot",
          text: "Hola Juan 😊 Te escribimos desde ORTOBOM ODONTOLOGÍA. Queremos recordarte tu cita de mantenimiento de ortodoncia con la Dra, el día 08/02/2026 a las 10:00. Por favor, confirma tu asistencia respondiendo solo SÍ.",
          timestamp: "9:30 AM",
          status: "delivered"
        },
        {
          id: 2,
          sender: "patient",
          text: "Sí, confirmo mi cita",
          timestamp: "9:45 AM",
          status: "read"
        },
        {
          id: 3,
          sender: "bot",
          text: "¡Excelente Juan! Tu cita está confirmada para el 08/02/2026 a las 10:00. Te esperamos. ¡Gracias!",
          timestamp: "9:45 AM",
          status: "delivered"
        }
      ]
    },
    {
      id: 3,
      patientName: "Ana Silva",
      patientPhone: "+591 7654-3212",
      channel: "clinic",
      lastMessage: "¿Cuánto cuesta el tratamiento?",
      timestamp: "8:20 AM",
      unread: true,
      starred: false,
      needsAction: false,
      messages: [
        {
          id: 1,
          sender: "patient",
          text: "¿Cuánto cuesta el tratamiento?",
          timestamp: "8:20 AM",
          status: "read"
        }
      ]
    },
    {
      id: 4,
      patientName: "Carlos Rodríguez",
      patientPhone: "+591 7654-3213",
      channel: "recordatorios",
      lastMessage: "No puedo asistir hoy",
      timestamp: "Yesterday",
      unread: false,
      starred: false,
      needsAction: true,
      messages: [
        {
          id: 1,
          sender: "bot",
          text: "Hola Carlos, este es un aviso final de ORTOBOM ODONTOLOGÍA. Tu cita de mantenimiento de ortodoncia con la Dra. está programada para hoy 07/02/2026 a las 15:00.",
          timestamp: "6:30 AM",
          status: "delivered"
        },
        {
          id: 2,
          sender: "patient",
          text: "No puedo asistir hoy",
          timestamp: "7:00 AM",
          status: "read"
        },
        {
          id: 3,
          sender: "bot",
          text: "Gracias por avisar Carlos. La secretaria te escribirá ahora para reagendarte. ¡Gracias!",
          timestamp: "7:00 AM",
          status: "delivered"
        }
      ]
    }
  ];

  const filteredConversations = conversations.filter(conv => {
    // Filtro por canal
    if (activeFilter === "clinic" && conv.channel !== "clinic") return false;
    if (activeFilter === "recordatorios" && conv.channel !== "recordatorios") return false;
    if (activeFilter === "unread" && !conv.unread) return false;
    if (activeFilter === "starred" && !conv.starred) return false;
    if (activeFilter === "needsAction" && !conv.needsAction) return false;
    
    // Filtro por busca
    if (searchQuery && !conv.patientName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const stats = {
    total: conversations.length,
    unread: conversations.filter(c => c.unread).length,
    needsAction: conversations.filter(c => c.needsAction).length,
    clinic: conversations.filter(c => c.channel === "clinic").length,
    recordatorios: conversations.filter(c => c.channel === "recordatorios").length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mensajes Recibidos</h1>
        <p className="text-gray-400">Inbox unificado de todos los canales de comunicación</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">No Leídos</p>
                <p className="text-2xl font-bold text-white">{stats.unread}</p>
              </div>
              <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {stats.unread}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Requieren Acción</p>
                <p className="text-2xl font-bold text-white">{stats.needsAction}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Canal Clínica</p>
                <p className="text-2xl font-bold text-white">{stats.clinic}</p>
              </div>
              <Phone className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Recordatorios</p>
                <p className="text-2xl font-bold text-white">{stats.recordatorios}</p>
              </div>
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Conversations List */}
        <div className="col-span-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar conversaciones..."
                    className="pl-10 bg-gray-800 border-gray-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={activeFilter === "all" ? "default" : "outline"}
                    onClick={() => setActiveFilter("all")}
                    className={activeFilter === "all" ? "bg-blue-600" : ""}
                  >
                    Todos
                  </Button>
                  <Button
                    size="sm"
                    variant={activeFilter === "unread" ? "default" : "outline"}
                    onClick={() => setActiveFilter("unread")}
                    className={activeFilter === "unread" ? "bg-blue-600" : ""}
                  >
                    No Leídos
                  </Button>
                  <Button
                    size="sm"
                    variant={activeFilter === "needsAction" ? "default" : "outline"}
                    onClick={() => setActiveFilter("needsAction")}
                    className={activeFilter === "needsAction" ? "bg-blue-600" : ""}
                  >
                    Acción
                  </Button>
                  <Button
                    size="sm"
                    variant={activeFilter === "starred" ? "default" : "outline"}
                    onClick={() => setActiveFilter("starred")}
                    className={activeFilter === "starred" ? "bg-blue-600" : ""}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                </div>

                {/* Channel Tabs */}
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                    <TabsTrigger value="all" onClick={() => setActiveFilter("all")}>
                      Todos
                    </TabsTrigger>
                    <TabsTrigger value="clinic" onClick={() => setActiveFilter("clinic")}>
                      Clínica
                    </TabsTrigger>
                    <TabsTrigger value="recordatorios" onClick={() => setActiveFilter("recordatorios")}>
                      Recordatorios
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 cursor-pointer hover:bg-gray-800 transition-colors ${
                      selectedConversation === conv.id ? "bg-gray-800" : ""
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {conv.patientName}
                          </h3>
                          <span className="text-xs text-gray-400">{conv.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-400 truncate mb-2">{conv.lastMessage}</p>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={conv.channel === "clinic" ? "bg-green-500" : "bg-purple-500"}
                            variant="secondary"
                          >
                            {conv.channel === "clinic" ? "Clínica" : "Recordatorios"}
                          </Badge>
                          {conv.unread && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                          {conv.starred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                          {conv.needsAction && (
                            <Badge className="bg-yellow-500">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Reagendar
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron conversaciones</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversation Detail */}
        <div className="col-span-8">
          {selectedConv ? (
            <Card className="bg-gray-900 border-gray-800 h-full flex flex-col">
              {/* Header */}
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedConv.patientName}</h3>
                      <p className="text-sm text-gray-400">{selectedConv.patientPhone}</p>
                    </div>
                    <Badge 
                      className={selectedConv.channel === "clinic" ? "bg-green-500" : "bg-purple-500"}
                    >
                      {selectedConv.channel === "clinic" ? "Canal Clínica" : "Canal Recordatorios"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Alert for Rescheduling Request */}
                {selectedConv.needsAction && (
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-500 mb-1">
                          Solicitud de Reagendamiento Detectada
                        </h4>
                        <p className="text-sm text-gray-300 mb-3">
                          El paciente {selectedConv.patientName} ha solicitado reagendar su cita. 
                          Por favor, contacta al paciente para confirmar la nueva fecha.
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Phone className="h-4 w-4 mr-2" />
                            Contactar Paciente
                          </Button>
                          <Button size="sm" variant="outline">
                            Marcar como Resuelto
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {selectedConv.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "patient" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender === "patient"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-200"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <span className="text-xs opacity-70">{message.timestamp}</span>
                          {message.sender === "bot" && message.status === "delivered" && (
                            <CheckCheck className="h-3 w-3 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Input (disabled for bot conversations) */}
              <div className="border-t border-gray-800 p-4">
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 mb-3">
                  <p className="text-sm text-yellow-500">
                    ⚠️ Esta es una conversación automática del sistema. 
                    Para responder manualmente, contacta al paciente directamente por WhatsApp.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Las respuestas automáticas están activas..."
                    className="flex-1 bg-gray-800 border-gray-700"
                    disabled
                  />
                  <Button disabled>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-gray-900 border-gray-800 h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecciona una conversación para ver los detalles</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
