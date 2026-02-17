// @ts-nocheck - Type issues to be fixed
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Phone, User, Calendar, MessageCircle, CheckCheck, Zap, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Conversas() {
  const [, navigate] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [statusFilter, setEstadoFilter] = useState<"all" | "unread" | "in_progress" | "resolved">("all");
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Query de respuestas rápidas y tags
  const quickRepliesQuery = trpc.quickReplies.getAll.useQuery();
  const tagsQuery = trpc.tags.getAll.useQuery();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const conversationsQuery = trpc.inbox.getConversations.useQuery(
    statusFilter === "all" ? {} : { status: statusFilter },
    { refetchInterval: 10000 } // Auto-refresh cada 10 segundos
  );

  const messagesQuery = trpc.inbox.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId, refetchInterval: 5000 }
  );

  // Mutations
  const sendReplyMutation = trpc.inbox.sendReply.useMutation({
    onSuccess: () => {
      setMessageText("");
      messagesQuery.refetch();
      conversationsQuery.refetch();
    },
  });

  const updateEstadoMutation = trpc.inbox.updateEstado.useMutation({
    onSuccess: () => {
      conversationsQuery.refetch();
    },
  });

  // Auto-scroll ao final quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  // Marcar como "em atendimento" ao abrir conversa
  useEffect(() => {
    if (selectedConversationId) {
      updateEstadoMutation.mutate({ 
        conversationId: selectedConversationId, 
        status: 'in_progress' 
      });
    }
  }, [selectedConversationId]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversationId || !selectedConversation) return;
    
    sendReplyMutation.mutate({
      conversationId: selectedConversationId,
      message: messageText,
      // @ts-expect-error - Property may not exist on type
      sessionId: selectedConversation.sessionId,
      // @ts-expect-error - Property may not exist on type
      phone: selectedConversation.phone || selectedConversation.patientPhone || "N/A",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversationsQuery.data?.find(
    (c) => c.id === selectedConversationId
  );

  const getEstadoBadgeColor = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-orange-500";
      case "in_progress":
        return "bg-blue-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getEstadoLabel = (status: string) => {
    switch (status) {
      case "unread":
        return "Não Lida";
      case "in_progress":
        return "Em Atendimento";
      case "resolved":
        return "Resolvida";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Conversas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie todas as conversas do WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal - 3 Colunas */}
      <div className="container py-6">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
          {/* Coluna 1: Lista de Conversas */}
          <Card className="col-span-3 p-4 overflow-y-auto">
            <Tabs value={statusFilter} onValueChange={(v) => setEstadoFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="unread">Não Lidas</TabsTrigger>
                <TabsTrigger value="in_progress">Em Atend.</TabsTrigger>
                <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Búsqueda de Pacientes */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Etiqueta */}
            <div className="mb-4">
              <Select
                value={tagFilter?.toString() || "all"}
                onValueChange={(value) => setTagFilter(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las etiquetas</SelectItem>
                  {tagsQuery.data?.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {conversationsQuery.isLoading && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Cargando conversas...
                </p>
              )}

              {conversationsQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Ningunoa conversa encontrada
                </p>
              )}

              {conversationsQuery.data
                ?.filter((conversation) => {
                  // Filtro de búsqueda por nombre o teléfono
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  // @ts-expect-error - Property may not exist on type
                  const matchesName = (conversation.patientName || "Paciente") || conversation.phone?.toLowerCase().includes(query);
                  const matchesPhone = conversation.phone.toLowerCase().includes(query);
                  return matchesName || matchesPhone;
                })
                .map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversationId === conversation.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          // @ts-expect-error - Property may not exist on type
                          {(conversation.patientName || "Paciente") || conversation.phone || conversation.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conversation.phone}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getEstadoBadgeColor(conversation.status)} text-white text-xs flex-shrink-0`}>
                      {getEstadoLabel(conversation.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 ml-14">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 ml-14">
                    {conversation.lastMessageAt ? new Date(conversation.lastMessageAt) : new Date().toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Coluna 2: Interface de Chat */}
          <Card className="col-span-6 flex flex-col">
            {!selectedConversationId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Seleccione uma conversa</p>
                  <p className="text-sm mt-2">Elija uma conversa da lista para começar</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header do Chat */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        // @ts-expect-error - Property may not exist on type
                        {selectedConversation?.patientName || selectedConversation?.patientPhone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        // @ts-expect-error - Property may not exist on type
                        {selectedConversation?.patientPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateEstadoMutation.mutate({
                          conversationId: selectedConversationId,
                          status: "resolved",
                        })
                      }
                      className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Marcar como Resolvida
                    </Button>
                  </div>
                </div>

                {/* Área de Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                  {messagesQuery.isLoading && (
                    <p className="text-sm text-muted-foreground text-center">
                      Cargando mensagens...
                    </p>
                  )}

                  {messagesQuery.data?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        (message.senderType === "patient" ? "incoming" : "outgoing") === "outgoing" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                          (message.senderType === "patient" ? "incoming" : "outgoing") === "outgoing"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            : "bg-white border"
                        }`}
                      >
                        // @ts-expect-error - Property may not exist on type
                        <p className="text-sm whitespace-pre-wrap break-words">{message.messageText}</p>
                        <p
                          className={`text-xs mt-1 ${
                            (message.senderType === "patient" ? "incoming" : "outgoing") === "outgoing"
                              ? "text-blue-100"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de Mensagem */}
                <div className="p-4 border-t bg-card">
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          title="Respuestas Rápidas"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-80">
                        {quickRepliesQuery.isLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Cargando...</div>
                        ) : quickRepliesQuery.data && quickRepliesQuery.data.length > 0 ? (
                          quickRepliesQuery.data.map((template) => (
                            <DropdownMenuItem
                              key={template.id}
                              // @ts-expect-error - Property may not exist on type
                              onClick={() => setMessageText(template.messageText)}
                              className="cursor-pointer flex-col items-start gap-1 p-3"
                            >
                              <div className="font-semibold text-sm">{template.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                // @ts-expect-error - Property may not exist on type
                                {template.messageText}
                              </div>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">Sin templates</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      disabled={sendReplyMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendReplyMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white px-6"
                    >
                      {sendReplyMutation.isPending ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Coluna 3: Detalles do Paciente */}
          <Card className="col-span-3 p-4 overflow-y-auto">
            {!selectedConversation ? (
              <div className="text-center text-muted-foreground py-8">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Seleccione uma conversa</p>
                <p className="text-xs mt-1">para ver os detalhes</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">
                    // @ts-expect-error - Property may not exist on type
                    {(selectedConversation.patientName || "Paciente") || "Paciente"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    // @ts-expect-error - Property may not exist on type
                    {selectedConversation.phone || selectedConversation.patientPhone || "N/A"}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      // @ts-expect-error - Property may not exist on type
                      <p className="text-sm font-medium truncate">{selectedConversation.phone || selectedConversation.patientPhone || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Primeira Conversa</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedConversation.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <MessageCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Total de Mensagens</p>
                      // @ts-expect-error - Property may not exist on type
                      <p className="text-sm font-medium">{selectedConversation.messageCount} mensagens</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Estado</p>
                  <Badge className={`${getEstadoBadgeColor(selectedConversation.status)} text-white w-full justify-center py-2`}>
                    {getEstadoLabel(selectedConversation.status)}
                  </Badge>
                </div>

                {selectedConversation.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Notas</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedConversation.notes}
                    </p>
                  </div>
                )}

                {selectedConversation.patientId && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate(`/patients/${selectedConversation.patientId}`)}
                  >
                    Ver Perfil Completo do Paciente
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
