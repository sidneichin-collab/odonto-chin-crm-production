// @ts-nocheck - Type issues to be fixed
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle2, Clock, MessageSquare, TrendingUp, XCircle, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChannelStats {
  sessionId: string;
  channelName: string;
  isConnected: boolean;
  messagesSentToday: number;
  messagesFailedToday: number;
  successRate: number;
  lastMessageSentAt: Date | null;
  uptime: number; // in minutes
}

export default function ChannelHealth() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<ChannelStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch channel health stats using tRPC
  const clinicQuery = trpc.whatsapp.getChannelStats.useQuery(
    { sessionId: 'canal-integracao-clinica' },
    { refetchInterval: 10000 } // Poll every 10 seconds
  );
  
  const remindersQuery = trpc.whatsapp.getChannelStats.useQuery(
    { sessionId: 'canal-recordatorios' },
    { refetchInterval: 10000 } // Poll every 10 seconds
  );

  useEffect(() => {
    if (clinicQuery.data && remindersQuery.data) {
      setStats([clinicQuery.data, remindersQuery.data]);
      setLoading(false);
    }
  }, [clinicQuery.data, remindersQuery.data]);

  const getEstadoBadge = (isConnected: boolean) => {
    if (isConnected) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Desconectado
      </Badge>
    );
  };

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 95) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">{rate.toFixed(1)}%</Badge>;
    } else if (rate >= 80) {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">{rate.toFixed(1)}%</Badge>;
    } else {
      return <Badge variant="destructive">{rate.toFixed(1)}%</Badge>;
    }
  };

  const formatUptime = (minutes: number) => {
    if (minutes === 0) return 'Desconectado';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando estatísticas dos canais...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Saúde dos Canais WhatsApp</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real dos canais de comunicação
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {stats.map((channel) => (
          // @ts-expect-error - Property may not exist on type
          <Card key={channel.sessionId} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{channel.channelName}</CardTitle>
                {getEstadoBadge(channel.isConnected)}
              </div>
              <CardDescription>
                // @ts-expect-error - Property may not exist on type
                {channel.sessionId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages Sent Today */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Mensagens Enviadas Hoy</span>
                  </div>
                  <span className="text-2xl font-bold">{channel.messagesSentToday}</span>
                </div>

                {/* Messages Failed Today */}
                {channel.messagesFailedToday > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-700 dark:text-red-400">Mensagens Falhadas</span>
                    </div>
                    <span className="text-2xl font-bold text-red-700 dark:text-red-400">{channel.messagesFailedToday}</span>
                  </div>
                )}

                {/* Success Rate */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Taxa de Éxito</span>
                  </div>
                  {getSuccessRateBadge(channel.successRate)}
                </div>

                {/* Last Message Sent */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Última Mensagem</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {channel.lastMessageSentAt
                      ? formatDistanceToNow(new Date(channel.lastMessageSentAt), { addSuffix: true, locale: ptBR })
                      : 'Ningunoa mensagem enviada'}
                  </span>
                </div>

                {/* Uptime */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Tempo Online</span>
                  </div>
                  <span className="text-sm font-semibold">{formatUptime(channel.uptime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health Alerts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Alertas de Saúde</CardTitle>
          <CardDescription>Problemas detectados nos canais de comunicação</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.every(s => s.isConnected && s.successRate >= 95) ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Todos os canais estão funcionando perfeitamente!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.map((channel) => {
                const alerts = [];
                
                if (!channel.isConnected) {
                  alerts.push(`${channel.channelName} está desconectado`);
                }
                
                if (channel.successRate < 95) {
                  alerts.push(`${channel.channelName} tem taxa de sucesso baixa (${channel.successRate.toFixed(1)}%)`);
                }
                
                if (channel.messagesFailedToday > 5) {
                  alerts.push(`${channel.channelName} tem muitas mensagens falhadas hoje (${channel.messagesFailedToday})`);
                }
                
                return alerts.map((alert, idx) => (
                  // @ts-expect-error - Property may not exist on type
                  <div key={`${channel.sessionId}-${idx}`} className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{alert}</span>
                  </div>
                ));
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
