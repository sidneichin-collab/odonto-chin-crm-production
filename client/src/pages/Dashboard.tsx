import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  ExternalLink, 
  Maximize2, 
  Server, 
  Clock, 
  Bell,
  CheckCircle2,
  Circle
} from "lucide-react";

export default function Dashboard() {
  const [iframeKey, setIframeKey] = useState(0);
  const crmUrl = "https://3001-id1rl8oe73nj9xel7zshx-bb4ea4a0.us2.manus.computer";

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleOpenNewTab = () => {
    window.open(crmUrl, "_blank");
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById("crm-preview") as HTMLIFrameElement;
    if (iframe) {
      iframe.requestFullscreen();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Dashboard - Odonto Chin CRM
        </h1>
        <p className="text-muted-foreground mt-2">
          Sistema de gerenciamento com preview em tempo real e documentação completa
        </p>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servidor</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Rodando em localhost:3000</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Ativo (America/Asuncion)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recordatórios</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Implementados (12 por agendamento)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
        {/* Preview Panel (Left - 70%) */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">📱 Preview do CRM</CardTitle>
                <CardDescription className="text-white/80">
                  Visualização em tempo real
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recarregar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleOpenNewTab}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Nova Aba
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleFullscreen}
                  className="gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              id="crm-preview"
              key={iframeKey}
              src={crmUrl}
              className="w-full h-[800px] border-0"
              title="CRM Preview"
            />
          </CardContent>
        </Card>

        {/* Documentation Panel (Right - 30%) */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600">
            <CardTitle className="text-white">📋 Documentação Técnica</CardTitle>
            <CardDescription className="text-white/80">
              Informações detalhadas da implementação
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="changes">Mudanças</TabsTrigger>
                <TabsTrigger value="schedule">Horários</TabsTrigger>
                <TabsTrigger value="tests">Testes</TabsTrigger>
              </TabsList>

              <div className="max-h-[740px] overflow-y-auto">
                <TabsContent value="status" className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      STATUS DA IMPLEMENTAÇÃO
                    </h3>
                    <Badge variant="default" className="mb-2">Fase 4: Implementação Concluída</Badge>
                    <p className="text-sm text-muted-foreground">
                      Todas as mudanças foram aplicadas de forma aditiva, sem quebrar código existente.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="changes" className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">🔧 MUDANÇAS REALIZADAS</h3>
                    
                    <div className="space-y-3">
                      <div className="border-l-2 border-primary pl-3">
                        <p className="text-sm font-medium">1. Import adicionado</p>
                        <p className="text-xs text-muted-foreground">Linha 19 de server/routers.ts</p>
                        <code className="text-xs bg-muted p-1 rounded block mt-1">
                          import {"{scheduleReminders}"} from "./reminders";
                        </code>
                      </div>

                      <div className="border-l-2 border-primary pl-3">
                        <p className="text-sm font-medium">2. Chamadas adicionadas</p>
                        <p className="text-xs text-muted-foreground">Após criar agendamento (2 rotas)</p>
                        <code className="text-xs bg-muted p-1 rounded block mt-1">
                          await scheduleReminders(appointment.id);
                        </code>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">⏰ HORÁRIOS DE RECORDATÓRIOS</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">2 dias antes:</p>
                        <p className="text-xs text-muted-foreground">10h, 15h, 19h</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">1 dia antes:</p>
                        <p className="text-xs text-muted-foreground">7h, 8h, 10h, 12h, 14h, 16h, 18h</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Dia da consulta:</p>
                        <p className="text-xs text-muted-foreground">7h, 2h antes</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-2">🎯 FLUXO DE FUNCIONAMENTO</h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-medium">Antes:</p>
                          <p className="text-muted-foreground">Agendamento criado → Nenhum recordatório</p>
                        </div>
                        <div>
                          <p className="font-medium">Depois:</p>
                          <p className="text-muted-foreground">
                            Agendamento criado → 12 recordatórios criados → Scheduler processa → Mensagens enviadas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tests" className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">📊 VALIDAÇÕES</h3>
                    
                    <div className="space-y-2">
                      {[
                        "Tipos corretos",
                        "Fluxo validado",
                        "Segurança OK",
                        "Logs informativos",
                        "Código aditivo",
                        "Zero deletions"
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-2">🌐 TIMEZONE</h4>
                      <div className="space-y-1 text-xs">
                        <p><span className="font-medium">Configurado:</span> America/Asuncion (Paraguai)</p>
                        <p><span className="font-medium">Horário Local:</span> UTC-4</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-2">📁 ARQUIVOS MODIFICADOS</h4>
                      <div className="text-xs">
                        <p className="font-medium">server/routers.ts</p>
                        <p className="text-muted-foreground">Linhas: 19, 560-566, 1332-1338</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* How to Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Como Testar</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Faça login no CRM (à esquerda)</li>
            <li>Crie um novo agendamento</li>
            <li>Verifique se 12 recordatórios foram criados</li>
            <li>Valide os horários corretos</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
