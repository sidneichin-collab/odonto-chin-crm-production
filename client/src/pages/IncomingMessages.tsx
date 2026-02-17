import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, RefreshCw, Ban, Clock, MessageSquare, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function IncomingMessages() {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const { data: messages, isLoading, refetch } = trpc.webhook.getRecentMessages.useQuery({
    limit: 100,
  });

  const intentFilters = [
    { value: null, label: "Todas", count: messages?.length || 0, color: "bg-gray-500" },
    { value: "confirmation_yes", label: "Confirmadas", icon: CheckCircle2, color: "bg-green-500" },
    { value: "confirmation_no", label: "Negadas", icon: XCircle, color: "bg-red-500" },
    { value: "reschedule", label: "Reagendar", icon: RefreshCw, color: "bg-blue-500" },
    { value: "cancel", label: "Cancelar", icon: Ban, color: "bg-orange-500" },
    { value: "unknown", label: "Desconhecidas", icon: Clock, color: "bg-gray-500" },
  ];

  const filteredMessages = selectedIntent
    ? messages?.filter((m) => m.detectedIntent === selectedIntent)
    : messages;

  const getIntentIcon = (intent: string | null) => {
    const iconMap: Record<string, any> = {
      confirmation_yes: CheckCircle2,
      confirmation_no: XCircle,
      reschedule: RefreshCw,
      cancel: Ban,
      unknown: Clock,
    };
    return iconMap[intent || "unknown"] || Clock;
  };

  const getIntentColor = (intent: string | null) => {
    const colorMap: Record<string, string> = {
      confirmation_yes: "bg-green-500",
      confirmation_no: "bg-red-500",
      reschedule: "bg-blue-500",
      cancel: "bg-orange-500",
      unknown: "bg-gray-500",
    };
    return colorMap[intent || "unknown"] || "bg-gray-500";
  };

  const getIntentLabel = (intent: string | null) => {
    const labelMap: Record<string, string> = {
      confirmation_yes: "Confirmado",
      confirmation_no: "Negado",
      reschedule: "Reagendar",
      cancel: "Cancelar",
      unknown: "Desconhecido",
    };
    return labelMap[intent || "unknown"] || "Desconhecido";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">📨 Mensagens Recebidas</h1>
        <p className="text-muted-foreground">
          Todas as mensagens recebidas via webhook e processadas pelo sistema
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filtrar por Intenção</h2>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {intentFilters.map((filter) => {
            const Icon = filter.icon || MessageSquare;
            const isActive = selectedIntent === filter.value;
            const count = filter.value
              ? messages?.filter((m) => m.detectedIntent === filter.value).length || 0
              : messages?.length || 0;

            return (
              <Button
                key={filter.value || "all"}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedIntent(filter.value)}
                className={isActive ? filter.color : ""}
              >
                <Icon className="w-4 h-4 mr-2" />
                {filter.label}
                <Badge variant="secondary" className="ml-2">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Messages List */}
      {isLoading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando mensagens...</span>
          </div>
        </Card>
      ) : filteredMessages && filteredMessages.length > 0 ? (
        <div className="grid gap-4">
          {filteredMessages.map((message) => {
            const Icon = getIntentIcon(message.detectedIntent);
            const intentColor = getIntentColor(message.detectedIntent);
            const intentLabel = getIntentLabel(message.detectedIntent);

            return (
              <Card key={message.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${intentColor} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{message.senderName || "Sem nome"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{message.senderPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge className={`${intentColor} text-white`}>
                      {intentLabel}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <p className="text-foreground">{message.message}</p>
                  </div>
                </div>

                {message.relatedAppointmentId && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      🗓️ Vinculada à consulta #{message.relatedAppointmentId}
                    </span>
                  </div>
                )}

                {message.isProcessed && message.processedAt && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    ✅ Processada em {format(new Date(message.processedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ningunoa mensagem encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {selectedIntent
                ? "Não há mensagens com essa intenção ainda."
                : "Ningunoa mensagem foi recebida ainda. Use o simulador de teste para enviar mensagens."}
            </p>
            {selectedIntent && (
              <Button variant="outline" onClick={() => setSelectedIntent(null)}>
                Ver todas as mensagens
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
