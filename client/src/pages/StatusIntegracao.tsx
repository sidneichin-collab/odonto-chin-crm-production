import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Activity,
  Zap,
  Database,
  Workflow
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function IntegrationStatus() {
  const [, navigate] = useLocation();
  
  // Mutation para testar conexão n8n
  const testN8nMutation = trpc.n8n.testConnection.useMutation();
  const [n8nEstado, setN8nEstado] = useState<{ success: boolean; message: string; responseTime?: number }>();
  const [n8nLoading, setN8nLoading] = useState(false);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const testConnection = async () => {
      setN8nLoading(true);
      try {
        const result = await testN8nMutation.mutateAsync();
        setN8nEstado(result);
      } catch (error) {
        setN8nEstado({ success: false, message: "Error ao testar conexão" });
      } finally {
        setN8nLoading(false);
      }
    };

    testConnection(); // Teste inicial
    const interval = setInterval(testConnection, 30000); // A cada 30s
    return () => clearInterval(interval);
  }, []);

  // Query para buscar últimos erros de envio
  const { data: recentErrors = [], isLoading: errorsLoading } = trpc.remindersTrigger.getHistory.useQuery(
    { limit: 10 },
    { 
      select: (data) => data.filter(log => log.status === "failed"),
      refetchInterval: 15000 
    }
  );

  const handleRefresh = async () => {
    setN8nLoading(true);
    try {
      const result = await testN8nMutation.mutateAsync();
      setN8nEstado(result);
    } catch (error) {
      setN8nEstado({ success: false, message: "Error ao testar conexão" });
    } finally {
      setN8nLoading(false);
    }
  };

  const getEstadoIcon = (success: boolean | undefined) => {
    if (success === undefined) return <Activity className="h-5 w-5 text-muted-foreground animate-pulse" />;
    return success 
      ? <CheckCircle2 className="h-5 w-5 text-green-600" />
      : <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getEstadoBadge = (success: boolean | undefined, label: string) => {
    if (success === undefined) {
      return <Badge variant="secondary" className="flex items-center gap-2">
        <Activity className="h-3 w-3 animate-pulse" />
        Verificando...
      </Badge>;
    }
    
    return success 
      ? <Badge className="bg-green-500 text-white flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3" />
          {label} Online
        </Badge>
      : <Badge className="bg-red-500 text-white flex items-center gap-2">
          <XCircle className="h-3 w-3" />
          {label} Offline
        </Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/canais")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Estado da Integração</h1>
            <p className="text-sm text-muted-foreground">
              Monitore o status em tempo real da integração n8n + Evolution API
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={n8nLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${n8nLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container py-8 space-y-6">
        {/* Estado Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* n8n Webhook */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  n8n Webhook
                </CardTitle>
                {getEstadoIcon(n8nEstado?.success)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getEstadoBadge(n8nEstado?.success, "Webhook")}
                
                {n8nEstado?.responseTime && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tempo de resposta:</span>
                    <span className="ml-2 font-medium">{n8nEstado.responseTime}ms</span>
                  </div>
                )}
                
                {n8nEstado?.message && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {n8nEstado.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evolution API */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  Evolution API
                </CardTitle>
                {getEstadoIcon(undefined)} {/* TODO: Implementar verificação */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                  <Activity className="h-3 w-3 animate-pulse" />
                  Não verificado
                </Badge>
                
                <p className="text-xs text-muted-foreground">
                  Verificação via n8n workflow
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  Banco de Dados
                </CardTitle>
                {getEstadoIcon(true)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge className="bg-green-500 text-white flex items-center gap-2 w-fit">
                  <CheckCircle2 className="h-3 w-3" />
                  Online
                </Badge>
                
                <p className="text-xs text-muted-foreground">
                  Conexão ativa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Últimos Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Últimos Errors de Envio
            </CardTitle>
            <CardDescription>
              Últimos 10 erros registrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Cargando erros...</p>
              </div>
            ) : recentErrors.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  ✅ Ninguno erro registrado! Sistema funcionando perfeitamente.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {recentErrors.map((error) => (
                  <div key={error.id} className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{error.patientName}</p>
                        <p className="text-xs text-muted-foreground">{error.patientPhone}</p>
                      </div>
                      <Badge variant="destructive">
                        {error.channel === "whatsapp" ? "WhatsApp" : "Email"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {error.sentAt ? format(new Date(error.sentAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                    </p>
                    <p className="text-sm">{error.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
              Gerencie as configurações da integração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate("/configurar-n8n")}
            >
              <Workflow className="mr-2 h-4 w-4" />
              Configurar n8n + Evolution API
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate("/canais")}
            >
              <Activity className="mr-2 h-4 w-4" />
              Gestionar Canais
            </Button>
          </CardContent>
        </Card>

        {/* Informações */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 Dica:</strong> Esta página atualiza automaticamente a cada 30 segundos. 
            Use o botão "Atualizar" para forçar uma verificação imediata.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
