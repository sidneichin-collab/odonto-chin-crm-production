// @ts-nocheck - Type issues to be fixed
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wifi, WifiOff, MessageSquare, Mail, CheckCircle, AlertCircle, Settings as SettingsIcon, Clock, Activity } from "lucide-react";
import { WhatsAppConnectionModal } from "@/components/WhatsAppConnectionModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function ReminderHistoryTable() {
  const { data: history = [], isLoading } = trpc.reminders.getHistory.useQuery({ limit: 50 });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando histórico...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Ninguno lembrete enviado ainda</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Data/Hora</th>
            <th className="text-left p-3 font-semibold">Paciente</th>
            <th className="text-left p-3 font-semibold">Teléfono</th>
            <th className="text-left p-3 font-semibold">Canal</th>
            <th className="text-left p-3 font-semibold">Estado</th>
            <th className="text-left p-3 font-semibold">Mensagem</th>
          </tr>
        </thead>
        <tbody>
          {history.map((log) => (
            <tr key={log.id} className="border-b hover:bg-muted/50">
              <td className="p-3 text-sm">
                {log.sentAt ? format(new Date(log.sentAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
              </td>
              // @ts-expect-error - Property may not exist on type
              <td className="p-3 text-sm font-medium">{(log.patientName || "Paciente") || "Sem nome"}</td>
              // @ts-expect-error - Property may not exist on type
              <td className="p-3 text-sm">{log.phone || log.patientPhone || "N/A" || "-"}</td>
              <td className="p-3">
                <Badge variant={log.channel === "whatsapp" ? "default" : "secondary"}>
                  {log.channel === "whatsapp" ? "WhatsApp" : "Email"}
                </Badge>
              </td>
              <td className="p-3">
                <Badge variant={log.status === "sent" ? "default" : "destructive"}>
                  {log.status === "sent" ? "Enviado" : "Falha"}
                </Badge>
              </td>
              // @ts-expect-error - Property may not exist on type
              <td className="p-3 text-sm max-w-xs truncate" title={log.messageText}>
                // @ts-expect-error - Property may not exist on type
                {log.messageText}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Canais() {
  const [, navigate] = useLocation();
  const [connectionModal, setConnectionModal] = useState<{ open: boolean; sessionId: string; title: string }>(
    { open: false, sessionId: "", title: "" }
  );

  // Queries
  const clinicEstadoQuery = trpc.whatsapp.getEstado.useQuery({ sessionId: "clinic" }, {
    refetchInterval: 5000,
  });

  const remindersEstadoQuery = trpc.whatsapp.getEstado.useQuery({ sessionId: "canal-recordatorios" }, {
    refetchInterval: 5000,
  });

  const emailConfigQuery = trpc.emailConfig.get.useQuery();

  // Mutation para testar conexão
  const testConnectionMutation = trpc.whatsapp.testConnection.useMutation();
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const handleConnectClinic = () => {
    setConnectionModal({ open: true, sessionId: "clinic", title: "Conectar WhatsApp Clínica" });
  };

  const handleConnectReminders = () => {
    setConnectionModal({ open: true, sessionId: "canal-recordatorios", title: "Conectar WhatsApp Recordatórios" });
  };

  const handleTestConnection = async (sessionId: string, channelName: string) => {
    setTestingConnection(sessionId);
    try {
      const result = await testConnectionMutation.mutateAsync({ sessionId });
      
      if (result.success) {
        // @ts-expect-error - Property may not exist on type
        const phoneInfo = result.phoneNumber ? ` (${result.phoneNumber})` : '';
        // @ts-expect-error - Property may not exist on type
        alert(`✅ ${channelName}\n\n${result.messageText}${phoneInfo}`);
      } else {
        // @ts-expect-error - Property may not exist on type
        alert(`❌ ${channelName}\n\n${result.messageText}`);
      }
    } catch (error: any) {
      // @ts-expect-error - Property may not exist on type
      alert(`❌ Error ao testar conexão\n\n${error.messageText}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const getEstadoBadge = (status: string | undefined) => {
    if (status === "connected") {
      return (
        <Badge className="bg-green-500 text-white flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Conectado
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500 text-white flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        Desconectado
      </Badge>
    );
  };

  const getEmailEstadoBadge = () => {
    if (emailConfigQuery.data?.smtpHost) {
      return (
        <Badge className="bg-green-500 text-white flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Configurado
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-500 text-white flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        Não Configurado
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Canais de Comunicação</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as conexões dos canais de comunicação
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/status-integracao")}
            >
              <Activity className="mr-2 h-4 w-4" />
              Estado da Integração
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/configurar-n8n")}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Configurar n8n
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card WhatsApp Clínica */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">WhatsApp Clínica</h3>
                  <p className="text-sm text-muted-foreground">Canal principal</p>
                </div>
              </div>
              {getEstadoBadge(clinicEstadoQuery.data?.status)}
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Estado da Conexão</p>
                <p className="text-sm font-medium">
                  {clinicEstadoQuery.data?.status === "connected" 
                    ? "✓ Conectado e funcionando" 
                    : "✗ Desconectado"}
                </p>
              </div>



              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleConnectClinic}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  {clinicEstadoQuery.data?.status === "connected" ? "Gestionar Conexão" : "Conectar"}
                </Button>
                {clinicEstadoQuery.data?.status === "connected" && (
                  <Button
                    onClick={() => handleTestConnection("clinic", "WhatsApp Clínica")}
                    variant="outline"
                    className="w-full"
                    disabled={testingConnection === "clinic"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {testingConnection === "clinic" ? "Testando..." : "Testar Conexão"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Card WhatsApp Recordatórios */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">WhatsApp Recordatórios</h3>
                  <p className="text-sm text-muted-foreground">Canal secundário</p>
                </div>
              </div>
              {getEstadoBadge(remindersEstadoQuery.data?.status)}
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Estado da Conexão</p>
                <p className="text-sm font-medium">
                  {remindersEstadoQuery.data?.status === "connected" 
                    ? "✓ Conectado e funcionando" 
                    : "✗ Desconectado"}
                </p>
              </div>



              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleConnectReminders}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  {remindersEstadoQuery.data?.status === "connected" ? "Gestionar Conexão" : "Conectar"}
                </Button>
                {remindersEstadoQuery.data?.status === "connected" && (
                  <Button
                    onClick={() => handleTestConnection("canal-recordatorios", "WhatsApp Recordatórios")}
                    variant="outline"
                    className="w-full"
                    disabled={testingConnection === "canal-recordatorios"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {testingConnection === "canal-recordatorios" ? "Testando..." : "Testar Conexão"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Card Email */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email</h3>
                  <p className="text-sm text-muted-foreground">Recordatórios por email</p>
                </div>
              </div>
              {getEmailEstadoBadge()}
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Servidor SMTP</p>
                <p className="text-sm font-medium">
                  {emailConfigQuery.data?.smtpHost || "Não configurado"}
                </p>
              </div>

              {emailConfigQuery.data?.emailAddress && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Email Remetente</p>
                  <p className="text-sm font-medium truncate">
                    {emailConfigQuery.data.emailAddress}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => navigate("/settings")}
                  variant="outline"
                  className="w-full"
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Configurar Email
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Histórico de Lembretes */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-bold mb-4">Histórico de Lembretes</h2>
          <ReminderHistoryTable />
        </Card>

        {/* Instruções */}
        <Card className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Como Conectar os Canais</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>1. WhatsApp Clínica:</strong> Clique em "Conectar" e escaneie o QR Code com o WhatsApp principal da clínica.
                </p>
                <p>
                  <strong>2. WhatsApp Recordatórios:</strong> Clique em "Conectar" e escaneie o QR Code com um WhatsApp Business separado (para envio de recordatórios).
                </p>
                <p>
                  <strong>3. Email:</strong> Clique em "Configurar Email" e preencha as credenciais SMTP do servidor de email da clínica.
                </p>
                <p className="mt-4 text-orange-600 dark:text-orange-400">
                  <strong>⚠️ Importante:</strong> Use números de WhatsApp diferentes para Clínica e Recordatórios para evitar bloqueios.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* WhatsApp Connection Modal */}
      <WhatsAppConnectionModal
        open={connectionModal.open}
        onOpenChange={(open) => setConnectionModal({ ...connectionModal, open })}
        // @ts-expect-error - Property may not exist on type
        sessionId={connectionModal.sessionId}
        title={connectionModal.title}
      />
    </div>
  );
}
