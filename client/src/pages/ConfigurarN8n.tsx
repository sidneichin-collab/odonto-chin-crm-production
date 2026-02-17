import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Loader2, ExternalLink, FileDown } from "lucide-react";

export default function ConfigurarN8n() {
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [evolutionSessionId, setEvolutionSessionId] = useState("canal-recordatorios");
  
  const saveConfig = trpc.n8n.saveConfig.useMutation();
  const testConnection = trpc.n8n.testConnection.useMutation();

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({
        n8nWebhookUrl,
        evolutionSessionId,
      });
      alert("✅ Configuración salva com sucesso!");
    } catch (error: any) {
      alert(`❌ Error ao salvar: ${error.message}`);
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync();
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Error ao testar: ${error.message}`);
    }
  };

  const downloadWorkflow = (filename: string) => {
    window.open(`/n8n-workflows/${filename}`, "_blank");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurar Integração n8n + WhatsApp</h1>
        <p className="text-muted-foreground mt-2">
          Configure a integração com n8n e Evolution API para enviar/receber mensagens WhatsApp
        </p>
      </div>

      {/* Passo 1: Download dos Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">1</span>
            Baixar Workflows n8n
          </CardTitle>
          <CardDescription>
            Faça o download dos workflows e importe no seu n8n
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => downloadWorkflow("1-enviar-whatsapp.json")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              1-enviar-whatsapp.json
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => downloadWorkflow("2-receber-whatsapp.json")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              2-receber-whatsapp.json
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => downloadWorkflow("README.md")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              README.md (Tutorial Completo)
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>Como importar no n8n:</strong><br />
              1. Acesse seu n8n (https://app.n8n.io ou sua instância)<br />
              2. Clique em "Workflows" → "Import from File"<br />
              3. Seleccione os arquivos JSON baixados<br />
              4. Ative os workflows clicando em "Active"
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 2: Configurar Evolution API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">2</span>
            Instalar Evolution API
          </CardTitle>
          <CardDescription>
            Instale a Evolution API no seu servidor (VPS)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Opções de instalação:</strong><br />
              • <strong>VPS Próprio:</strong> Contabo (€5/mês), DigitalOcean ($6/mês), AWS, etc<br />
              • <strong>Serviço Gerenciado:</strong> Evolution API Cloud (pago)<br />
              <br />
              Siga o tutorial completo no <strong>README.md</strong> para instruções detalhadas de instalação.
            </AlertDescription>
          </Alert>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open("https://doc.evolution-api.com/v2/en/get-started/introduction", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Documentação Evolution API
          </Button>
        </CardContent>
      </Card>

      {/* Passo 3: Configurar URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">3</span>
            Configurar URLs do n8n
          </CardTitle>
          <CardDescription>
            Cole as URLs dos webhooks n8n aqui
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="n8nWebhookUrl">URL Webhook n8n (Enviar Mensagens)</Label>
            <Input
              id="n8nWebhookUrl"
              placeholder="https://seu-n8n.app.n8n.cloud/webhook/enviar-whatsapp"
              value={n8nWebhookUrl}
              onChange={(e) => setN8nWebhookUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Copie a URL do webhook do workflow "CRM Odonto Chin - Enviar WhatsApp"
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolutionSessionId">Session ID Evolution API</Label>
            <Input
              id="evolutionSessionId"
              placeholder="canal-recordatorios"
              value={evolutionSessionId}
              onChange={(e) => setEvolutionSessionId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Nome da instância criada na Evolution API (padrão: canal-recordatorios)
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!n8nWebhookUrl || saveConfig.isPending}
              className="flex-1"
            >
              {saveConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!n8nWebhookUrl || testConnection.isPending}
            >
              {testConnection.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Passo 4: Estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">4</span>
            Estado da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Workflows n8n</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                Não verificado
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Evolution API</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                Não verificado
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Webhook CRM</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {n8nWebhookUrl ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Configurado
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    Não configurado
                  </>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ajuda */}
      <Alert>
        <AlertDescription>
          <strong>📚 Precisa de ajuda?</strong><br />
          Leia o <strong>README.md</strong> completo com tutorial passo-a-passo, troubleshooting e dicas importantes.
          <br /><br />
          <strong>💡 Dica:</strong> Após configurar, vá em <strong>Agendamientos</strong> e clique em "Enviar Lembrete Agora" para testar o envio!
        </AlertDescription>
      </Alert>
    </div>
  );
}
