// @ts-nocheck - Type issues to be fixed
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Link as LinkIcon, MessageCircle, Mail, Facebook, Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Power, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const platformIcons = {
  whatsapp: MessageSquare,
  messenger: MessageCircle,
  n8n: LinkIcon,
  chatwoot: MessageSquare,
  email: Mail,
  facebook: Facebook,
};

const platformColors = {
  whatsapp: 'from-green-500 to-green-600',
  messenger: 'from-blue-500 to-blue-600',
  n8n: 'from-purple-500 to-purple-600',
  chatwoot: 'from-orange-500 to-orange-600',
  email: 'from-gray-500 to-gray-600',
  facebook: 'from-blue-600 to-blue-700',
};

const platformNames = {
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
  n8n: 'n8n',
  chatwoot: 'Chatwoot',
  email: 'Email',
  facebook: 'Facebook',
};

export default function Integraciones() {
  const [, navigate] = useLocation();
  const [selectedChannel, setSelectedChannel] = useState<'clinic' | 'reminders' | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [phone, setPhone] = useState("+595981234567");
  const [message, setMessage] = useState("");
  const [qrCodeData, setQrCodeData] = useState<{qrCode: string, status: string} | null>(null);
  const [isPollingQR, setIsPollingQR] = useState(false);

  // Query status for both channels
  const { data: clinicEstado, refetch: refetchClinic } = trpc.whatsapp.getEstado.useQuery(
    { sessionId: 'canal-clinica' },
    { refetchInterval: 5000 }
  );

  const { data: remindersEstado, refetch: refetchReminders } = trpc.whatsapp.getEstado.useQuery(
    { sessionId: 'canal-recordatorios' },
    { refetchInterval: 5000 }
  );

  // Determine sessionId based on selected channel
  const sessionId = selectedChannel === 'clinic' ? 'canal-clinica' : 'canal-recordatorios';
  const currentEstado = selectedChannel === 'clinic' ? clinicEstado : remindersEstado;

  // Mutations
  const initializeMutation = trpc.whatsapp.initialize.useMutation({
    onSuccess: (data) => {
      // Store QR code from mutation response
      if (data.qrCode) {
        toast.success("QR Code gerado! Escaneie para conectar.");
        setQrCodeData({ qrCode: data.qrCode, status: 'qr' });
        setIsPollingQR(false);
      } else {
        // QR code not ready yet, start polling
        toast.info("Aguardando geração do QR Code...");
        setIsPollingQR(true);
      }
    },
    onError: (error) => {
      toast.error(error.messageText);
      setQrCodeData(null);
      setIsPollingQR(false);
    },
  });

  const sendMessageMutation = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem de teste enviada com sucesso!");
      setMessage("");
    },
    onError: (error) => {
      toast.error(error.messageText);
    },
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado com sucesso");
      refetchClinic();
      refetchReminders();
    },
    onError: (error) => {
      toast.error(error.messageText);
    },
  });

  // Polling effect to check for QR code
  useEffect(() => {
    if (!isPollingQR || !selectedChannel) return;

    const pollInterval = setInterval(async () => {
      const refetch = selectedChannel === 'clinic' ? refetchClinic : refetchReminders;
      const result = await refetch();
      
      if (result.data?.qrCode) {
        setQrCodeData({ qrCode: result.data.qrCode, status: result.data.status });
        setIsPollingQR(false);
        toast.success("QR Code gerado! Escaneie para conectar.");
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 30 seconds
    const timeout = setTimeout(() => {
      setIsPollingQR(false);
      toast.error("Timeout: QR Code não foi gerado. Tente novamente.");
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isPollingQR, selectedChannel, refetchClinic, refetchReminders]);

  const handleConnect = async (channel: 'clinic' | 'reminders', platform: string) => {
    setSelectedChannel(channel);
    setSelectedPlatform(platform);

    if (platform === 'whatsapp') {
      const sid = channel === 'clinic' ? 'canal-clinica' : 'canal-recordatorios';
      setShowQRDialog(true);
      setQrCodeData(null); // Clear previous QR code
      
      // Initialize WhatsApp session
      initializeMutation.mutate({ sessionId: sid });
    } else {
      toast.info(`Integração ${platformNames[platform as keyof typeof platformNames]} em desenvolvimento`);
    }
  };

  const handleDisconnect = (channel: 'clinic' | 'reminders', platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (platform === 'whatsapp') {
      const sid = channel === 'clinic' ? 'canal-clinica' : 'canal-recordatorios';
      const channelName = channel === 'clinic' ? 'Canal Clínica' : 'Canal Recordatórios';
      
      if (confirm(`Deseja realmente desconectar o WhatsApp do ${channelName}?`)) {
        disconnectMutation.mutate({ sessionId: sid });
      }
    }
  };

  const handleSendTestMessage = () => {
    if (!phone || !message) {
      toast.error("Preencha telefone e mensagem");
      return;
    }

    sendMessageMutation.mutate({
      sessionId,
      phone,
      message,
    });
  };

  const getEstadoBadge = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Conectado
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Conectando...
          </div>
        );
      case 'qr':
        return (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <RefreshCw className="w-3 h-3" />
            Aguardando QR
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <XCircle className="w-3 h-3" />
            Desconectado
          </div>
        );
      default:
        return null;
    }
  };

  const renderWhatsAppCard = (channel: 'clinic' | 'reminders') => {
    const status = channel === 'clinic' ? clinicEstado : remindersEstado;
    const isConnected = status?.status === 'connected';
    const Icon = platformIcons.whatsapp;

    return (
      <Card
        key={`whatsapp-${channel}`}
        className={`p-6 bg-gradient-to-br ${platformColors.whatsapp} text-white cursor-pointer hover:scale-105 transition-transform relative`}
        onClick={() => handleConnect(channel, 'whatsapp')}
      >
        {/* Estado Badge */}
        {status && (
          <div className="absolute top-2 right-2">
            {getEstadoBadge(status.status)}
          </div>
        )}

        <div className="flex flex-col items-center text-center gap-4 mt-4">
          <Icon className="w-12 h-12" />
          <div>
            <h3 className="font-bold text-lg mb-1">
              {platformNames.whatsapp}
            </h3>
            <p className="text-xs opacity-90 mb-2">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </p>
          </div>
          
          {isConnected ? (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={(e) => handleDisconnect(channel, 'whatsapp', e)}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Desconectar
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleConnect(channel, 'whatsapp');
              }}
            >
              Conectar
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const renderPlatformCard = (channel: 'clinic' | 'reminders', platform: keyof typeof platformIcons) => {
    if (platform === 'whatsapp') {
      return renderWhatsAppCard(channel);
    }

    const Icon = platformIcons[platform];
    
    return (
      <Card
        key={platform}
        className={`p-6 bg-gradient-to-br ${platformColors[platform]} text-white cursor-pointer hover:scale-105 transition-transform`}
        onClick={() => handleConnect(channel, platform)}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <Icon className="w-12 h-12" />
          <div>
            <h3 className="font-bold text-lg mb-1">
              {platformNames[platform]}
            </h3>
            <p className="text-xs opacity-90 mb-2">
              0 conectados
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleConnect(channel, platform);
            }}
          >
            Conectar
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="container py-8">
      {/* Botão Volver */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver ao Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Canais de Integração</h1>
        <p className="text-muted-foreground">
          Gerencie WhatsApp, Messenger, n8n e Chatwoot separados por propósito
        </p>
      </div>

      {/* Alert sobre 2 canais separados */}
      <Card className="p-4 mb-8 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Por que 2 canais separados?</h3>
            <p className="text-sm text-blue-700">
              Usar números diferentes para comunicação geral e recordatórios automáticos evita bloqueios do WhatsApp. 
              O canal de recordatórios envia muitas mensagens automáticas, enquanto o canal da clínica é usado para 
              conversas individuais com pacientes.
            </p>
          </div>
        </div>
      </Card>

      {/* Canal de Integração da Clínica */}
      <div className="mb-12">
        <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-cyan-900 mb-2">
                Canal de Integração da Clínica
              </h2>
              <p className="text-cyan-700">
                Para comunicação geral, atendimento e conversas individuais com pacientes
              </p>
              <p className="text-xs text-cyan-600 mt-1">
                Limite: 50 mensagens/hora • Uso: comunicação interativa
              </p>
            </div>
            <Send className="w-8 h-8 text-cyan-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderPlatformCard('clinic', 'whatsapp')}
            {(['messenger', 'n8n', 'chatwoot'] as const).map((platform) => 
              renderPlatformCard('clinic', platform)
            )}
          </div>
        </Card>
      </div>

      {/* Canal de Recordatórios */}
      <div>
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-orange-900 mb-2">
                Canal de Recordatórios
              </h2>
              <p className="text-orange-700">
                Exclusivo para envio automático de recordatórios de consultas em massa
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Limite: 30 mensagens/hora • Uso: recordatórios automáticos
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-orange-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderPlatformCard('reminders', 'whatsapp')}
            {(['messenger', 'n8n', 'chatwoot'] as const).map((platform) => 
              renderPlatformCard('reminders', platform)
            )}
          </div>
        </Card>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp - {selectedChannel === 'clinic' ? 'Canal Clínica' : 'Canal Recordatórios'}</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Estado Badge */}
            <div className="flex items-center justify-center">
              {currentEstado?.status && getEstadoBadge(currentEstado.status)}
            </div>

            {/* QR Code Display - Use qrCodeData from mutation OR currentEstado from query */}
            {(qrCodeData?.qrCode || (currentEstado?.status === 'qr' && currentEstado.qrCode)) && (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img 
                    src={qrCodeData?.qrCode || currentEstado?.qrCode || ''} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Abra o WhatsApp no seu celular e escaneie este QR Code
                </p>
              </div>
            )}

            {/* Loading State */}
            {!qrCodeData && (!currentEstado || currentEstado.status === 'connecting') && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Inicializando sessão do WhatsApp...
                </p>
              </div>
            )}

            {/* Connected State */}
            {currentEstado?.status === 'connected' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600 py-4">
                  <CheckCircle2 className="w-8 h-8" />
                  <span className="text-lg font-semibold">WhatsApp Conectado!</span>
                </div>

                {/* Test Message Form */}
                <Card className="p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4">Enviar Mensagem de Teste</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="phone">Teléfono (com código do país)</Label>
                      <Input
                        id="phone"
                        placeholder="+595981234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        placeholder="Digite sua mensagem de teste..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleSendTestMessage}
                      disabled={sendMessageMutation.isPending}
                      className="w-full"
                    >
                      {sendMessageMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem de Teste
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Close Button */}
                <Button 
                  variant="outline" 
                  onClick={() => setShowQRDialog(false)}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
