// @ts-nocheck - Type issues to be fixed
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MessageCircle, Send, Check, Clock, CheckCheck, User, Phone, Reply, Search, Settings, Plus, Trash2, Upload, X, Image, Music, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ConversationEstado = 'unread' | 'in_progress' | 'resolved';

export default function MensagensRecebidas() {
  const [selectedChannel, setSelectedChannel] = useState<string | undefined>(undefined);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch conversations with filters
  const { data: allConversations = [], refetch } = trpc.inbox.getConversations.useQuery({
    sessionId: selectedChannel,
  });

  // Filter conversations by search query
  const conversations = allConversations.filter((c: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (c.patientName || "Paciente")?.toLowerCase().includes(query) ||
      c.phone || c.patientPhone || "N/A"?.toLowerCase().includes(query)
    );
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = trpc.inbox.getMessages.useQuery(
    { conversationId: selectedConversation?.id },
    { enabled: !!selectedConversation }
  );

  // Fetch quick replies
  const { data: quickRepliesData = [], refetch: refetchQuickReplies } = trpc.quickReplies.getAll.useQuery();

  // Fetch active A/B tests
  const { data: activeTests = [] } = trpc.abTests.list.useQuery({ status: 'active' });

  // Mutations
  const updateEstadoMutation = trpc.inbox.updateEstado.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('¡Estado actualizado!');
    },
  });

  const sendReplyMutation = trpc.inbox.sendReply.useMutation({
    onSuccess: () => {
      refetch();
      setReplyMessage('');
      toast.success('¡Mensaje enviado!');
    },
    onError: (error) => {
      toast.error(`Error al enviar: ${error.messageText}`);
    },
  });

  const markAsResolvedMutation = trpc.inbox.markAsResolved.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedConversation(null);
      toast.success('¡Conversación resuelta!');
    },
  });

  const createQuickReplyMutation = trpc.quickReplies.create.useMutation({
    onSuccess: () => {
      refetchQuickReplies();
      setNewTemplateTitle('');
      setNewTemplateMessage('');
      toast.success('¡Plantilla creada!');
    },
    onError: (error) => {
      toast.error(`Error: ${error.messageText}`);
    },
  });

  const deleteQuickReplyMutation = trpc.quickReplies.delete.useMutation({
    onSuccess: () => {
      refetchQuickReplies();
      toast.success('¡Plantilla eliminada!');
    },
  });

  const recordABTestResultMutation = trpc.abTests.recordResult.useMutation({
    onSuccess: () => {
      // Result recorded successfully
    },
  });

  const utils = trpc.useUtils();

  // Group conversations by status
  const unreadConversations = conversations.filter((c: any) => c.status === 'unread');
  const inProgressConversations = conversations.filter((c: any) => c.status === 'in_progress');
  const resolvedConversations = conversations.filter((c: any) => c.status === 'resolved');

  const handleEstadoChange = (conversationId: number, newEstado: ConversationEstado) => {
    updateEstadoMutation.mutate({ conversationId, status: newEstado });
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    sendReplyMutation.mutate({
      conversationId: selectedConversation.id,
      message: replyMessage,
      sessionId: selectedConversation.sessionId,
      phone: selectedConversation.phone || selectedConversation.patientPhone || "N/A",
    });
  };

  const handleMarkAsResolved = () => {
    if (!selectedConversation) return;
    markAsResolvedMutation.mutate({ conversationId: selectedConversation.id });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const conversationId = Number(active.id);
    const newEstado = over.id as ConversationEstado;
    
    // Find the conversation
    const conversation = conversations.find((c: any) => c.id === conversationId);
    if (!conversation || conversation.status === newEstado) return;
    
    // Update status
    handleEstadoChange(conversationId, newEstado);
  };

  const SortableConversationCard = ({ conversation }: { conversation: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: conversation.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div className="relative">
          <div 
            {...listeners}
            className="absolute top-2 right-2 cursor-move p-2 hover:bg-gray-200 rounded z-10"
            title="Arrastrar para mover"
          >
            ☰
          </div>
          {renderConversationCard(conversation)}
        </div>
      </div>
    );
  };

  const renderConversationCard = (conversation: any) => {
    const channelName = conversation.sessionId === 'canal-integracao-clinica' 
      ? 'Clínica' 
      : 'Recordatórios';
    
    const statusColor = {
      unread: 'bg-red-500',
      in_progress: 'bg-yellow-500',
      resolved: 'bg-green-500',
    }[conversation.status as ConversationEstado];

    return (
      <Card
        key={conversation.id}
        className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedConversation(conversation)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              <h4 className="font-semibold text-sm">{(conversation.patientName || "Paciente") || 'Desconhecido'}</h4>
            </div>
            <Badge variant="outline" className="text-xs">
              {channelName}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Phone className="w-3 h-3" />
            <span>{conversation.phone || conversation.patientPhone || "N/A"}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {conversation.lastMessage}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {conversation.messageCount} mensagens
            </span>
            <span>
              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKanbanColumn = (
    title: string,
    conversations: any[],
    status: ConversationEstado,
    icon: React.ReactNode,
    colorClass: string
  ) => {
    const { setNodeRef } = useDroppable({ id: status });

    return (
      <div className="flex-1 min-w-[320px]">
        <Card className="h-full">
          <CardHeader className={`${colorClass} text-white`}>
            <CardTitle className="flex items-center gap-2 text-lg">
              {icon}
              {title}
              <Badge variant="secondary" className="ml-auto">
                {conversations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent ref={setNodeRef} className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Ninguna conversación
              </p>
            ) : (
              <SortableContext items={conversations.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                {conversations.map((conversation: any) => (
                  <SortableConversationCard key={conversation.id} conversation={conversation} />
                ))}
              </SortableContext>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mensajes Recibidos</h1>
        <p className="text-muted-foreground">
          Gestione conversaciones WhatsApp de los canales Clínica y Recordatorios
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={selectedChannel === undefined ? 'default' : 'outline'}
          onClick={() => setSelectedChannel(undefined)}
        >
          Todos los Canales
        </Button>
        <Button
          variant={selectedChannel === 'canal-integracao-clinica' ? 'default' : 'outline'}
          onClick={() => setSelectedChannel('canal-integracao-clinica')}
        >
          Canal Clínica
        </Button>
        <Button
          variant={selectedChannel === 'canal-recordatorios' ? 'default' : 'outline'}
          onClick={() => setSelectedChannel('canal-recordatorios')}
        >
          Canal Recordatorios
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {renderKanbanColumn(
            'No Leídas',
            unreadConversations,
            'unread',
            <Clock className="w-5 h-5" />,
            'bg-red-500'
          )}
          {renderKanbanColumn(
            'En Atención',
            inProgressConversations,
            'in_progress',
            <MessageCircle className="w-5 h-5" />,
            'bg-yellow-500'
          )}
          {renderKanbanColumn(
            'Resueltas',
            resolvedConversations,
            'resolved',
            <CheckCheck className="w-5 h-5" />,
            'bg-green-500'
          )}
        </div>
      </DndContext>

      {/* Conversation Modal */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedConversation?.patientName || 'Desconocido'}
              <Badge variant="outline" className="ml-2">
                {selectedConversation?.patientPhone}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex ${(msg.senderType === "patient" ? "incoming" : "outgoing") === 'outgoing' ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="flex items-end gap-2">
                  {(msg.senderType === "patient" ? "incoming" : "outgoing") === 'incoming' && (
                    <button
                      onClick={() => {
                        setReplyMessage(`> ${msg.messageText}\n\n`);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-200 rounded-full"
                      title="Responder"
                    >
                      <Reply className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      (msg.senderType === "patient" ? "incoming" : "outgoing") === 'outgoing'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          <div className="border-t pt-4 space-y-3">
            {/* Quick Reply Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickRepliesData.map((template: any) => (
                <Button
                  key={template.id}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // If template has multimedia, send immediately
                    if (template.mediaUrl && template.mediaType !== 'text') {
                      sendReplyMutation.mutate({
                        conversationId: selectedConversation.id,
                        message: template.messageText,
                        sessionId: selectedConversation.sessionId,
                        phone: selectedConversation.phone || selectedConversation.patientPhone || "N/A",
                        mediaUrl: template.mediaUrl,
                        mediaType: template.mediaType,
                        templateId: template.id,
                        patientName: (selectedConversation.patientName || "Paciente"),
                      });
                    } else {
                      // Just fill the text area
                      setReplyMessage(template.messageText);
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  {template.mediaType === 'image' && <Image className="w-3 h-3" />}
                  {template.mediaType === 'audio' && <Music className="w-3 h-3" />}
                  {template.mediaType === 'video' && <Video className="w-3 h-3" />}
                  {template.title}
                </Button>
              ))}
              
              {/* A/B Test Buttons */}
              {activeTests.map((test: any) => (
                <Button
                  key={`test-${test.id}`}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      // Get next variant to use
                      const nextVariant = await utils.client.abTests.getNextVariant.query({ testId: test.id });
                      
                      if (!nextVariant) {
                        toast.error('No se pudo obtener variante del test');
                        return;
                      }

                      // Send message with the variant
                      await sendReplyMutation.mutateAsync({
                        conversationId: selectedConversation.id,
                        message: nextVariant.data.messageText,
                        sessionId: selectedConversation.sessionId,
                        phone: selectedConversation.phone || selectedConversation.patientPhone || "N/A",
                        mediaUrl: nextVariant.data.mediaUrl,
                        mediaType: nextVariant.data.mediaType,
                      });

                      // Record the test result
                      await recordABTestResultMutation.mutateAsync({
                        testId: test.id,
                        variantId: nextVariant.variantId,
                        variant: nextVariant.variant,
                        conversationId: selectedConversation.id,
                        patientPhone: selectedConversation.phone || selectedConversation.patientPhone || "N/A",
                        patientName: (selectedConversation.patientName || "Paciente"),
                      });

                      toast.success(`Enviado con variante ${nextVariant.variant}`);
                    } catch (error: any) {
                      toast.error(`Error: ${error.messageText}`);
                    }
                  }}
                  className="flex items-center gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  🧪 {test.name}
                </Button>
              ))}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTemplatesModal(true)}
                className="text-muted-foreground"
              >
                <Settings className="w-4 h-4 mr-1" />
                Gestionar Plantillas
              </Button>
            </div>
            <Textarea
              placeholder="Escriba su respuesta..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
              {selectedConversation?.status !== 'resolved' && (
                <Button
                  variant="outline"
                  onClick={handleMarkAsResolved}
                  disabled={markAsResolvedMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Resolver
                </Button>
              )}
              {selectedConversation?.status === 'unread' && (
                <Button
                  variant="outline"
                  onClick={() => handleEstadoChange(selectedConversation.id, 'in_progress')}
                  disabled={updateEstadoMutation.isPending}
                >
                  En Atención
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Management Modal */}
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gestionar Plantillas de Respuestas Rápidas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create New Template Form */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Crear Nueva Plantilla
              </h3>
              <Input
                placeholder="Título de la plantilla (ej: Gracias por confirmar)"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
              />
              <Textarea
                placeholder="Mensaje completo..."
                value={newTemplateMessage}
                onChange={(e) => setNewTemplateMessage(e.target.value)}
                rows={3}
              />
              
              {/* File Upload Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Archivo Multimedia (Opcional)</label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*,audio/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        // Create preview URL
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFilePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {/* File Preview */}
                {filePreview && selectedFile && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-3">
                      {selectedFile.type.startsWith('image/') && (
                        <><Image className="w-5 h-5 text-blue-500" />
                        <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded" /></>
                      )}
                      {selectedFile.type.startsWith('audio/') && (
                        <><Music className="w-5 h-5 text-green-500" />
                        <audio src={filePreview} controls className="flex-1" /></>
                      )}
                      {selectedFile.type.startsWith('video/') && (
                        <><Video className="w-5 h-5 text-purple-500" />
                        <video src={filePreview} controls className="w-full max-h-40 rounded" /></>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={async () => {
                  if (!newTemplateTitle.trim() || !newTemplateMessage.trim()) {
                    toast.error('Por favor complete todos los campos');
                    return;
                  }
                  
                  let mediaUrl: string | null = null;
                  let mediaType: 'text' | 'image' | 'audio' | 'video' = 'text';
                  let mediaMimeType: string | null = null;
                  
                  // Upload file to S3 if selected
                  if (selectedFile) {
                    setIsUploading(true);
                    try {
                      const formData = new FormData();
                      formData.append('file', selectedFile);
                      
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      if (!response.ok) throw new Error('Upload failed');
                      
                      const data = await response.json();
                      mediaUrl = data.url;
                      mediaMimeType = selectedFile.type;
                      
                      if (selectedFile.type.startsWith('image/')) mediaType = 'image';
                      else if (selectedFile.type.startsWith('audio/')) mediaType = 'audio';
                      else if (selectedFile.type.startsWith('video/')) mediaType = 'video';
                    } catch (error) {
                      toast.error('Error al subir archivo');
                      setIsUploading(false);
                      return;
                    }
                    setIsUploading(false);
                  }
                  
                  createQuickReplyMutation.mutate({
                    title: newTemplateTitle,
                    message: newTemplateMessage,
                    mediaType,
                    mediaUrl,
                    mediaMimeType,
                  });
                  
                  // Clear form
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                disabled={createQuickReplyMutation.isPending || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>Subiendo archivo...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" />
                  Crear Plantilla</>
                )}
              </Button>
            </div>

            {/* Existing Templates List */}
            <div className="space-y-2">
              <h3 className="font-semibold">Plantillas Existentes</h3>
              {quickRepliesData.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay plantillas. Cree su primera plantilla arriba.
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {quickRepliesData.map((template: any) => (
                    <div key={template.id} className="border rounded-lg p-3 flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.title}</h4>
                          {template.mediaType && template.mediaType !== 'text' && (
                            <Badge variant="secondary" className="text-xs">
                              {template.mediaType === 'image' && <><Image className="w-3 h-3 mr-1" />Imagen</>}
                              {template.mediaType === 'audio' && <><Music className="w-3 h-3 mr-1" />Audio</>}
                              {template.mediaType === 'video' && <><Video className="w-3 h-3 mr-1" />Video</>}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{template.messageText}</p>
                        {template.mediaUrl && (
                          <a 
                            href={template.mediaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline mt-1 block"
                          >
                            Ver archivo adjunto →
                          </a>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteQuickReplyMutation.mutate({ id: template.id })}
                        disabled={deleteQuickReplyMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
