import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, CheckCircle2, XCircle, Clock, RefreshCw, Ban } from "lucide-react";

export default function TestWebhook() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    senderPhone: "5511999999999",
    senderName: "João Silva",
    message: "Sim, confirmo minha presença",
  });

  const quickMessages = [
    { label: "✅ Confirmar (SIM)", message: "Sim, confirmo minha presença", icon: CheckCircle2, color: "text-green-600" },
    { label: "❌ Negar (NÃO)", message: "Não posso ir amanhã", icon: XCircle, color: "text-red-600" },
    { label: "🔄 Remarcar", message: "Preciso remarcar para outro dia", icon: RefreshCw, color: "text-blue-600" },
    { label: "🚫 Cancelar", message: "Quero cancelar minha consulta", icon: Ban, color: "text-orange-600" },
  ];

  const sendWebhookTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Simular payload da Evolution API
      const payload = {
        event: "messages.upsert",
        instance: "canal-recordatorios",
        data: {
          key: {
            remoteJid: `${formData.senderPhone}@s.whatsapp.net`,
            fromMe: false,
            id: `TEST${Date.now()}`,
          },
          message: {
            conversation: formData.message,
          },
          messageTimestamp: Math.floor(Date.now() / 1000).toString(),
          pushName: formData.senderName,
        },
      };

      const response = await fetch("/api/webhook/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success("Mensagem processada com sucesso!");
      } else {
        toast.error("Error ao processar mensagem");
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getIntentBadge = (intent: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      confirmation_yes: { label: "Confirmado (SIM)", color: "bg-green-500", icon: CheckCircle2 },
      confirmation_no: { label: "Negado (NÃO)", color: "bg-red-500", icon: XCircle },
      reschedule: { label: "Reagendar", color: "bg-blue-500", icon: RefreshCw },
      cancel: { label: "Cancelar", color: "bg-orange-500", icon: Ban },
      unknown: { label: "Desconhecido", color: "bg-gray-500", icon: Clock },
    };

    const badge = badges[intent] || badges.unknown;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">🧪 Teste de Webhook</h1>
        <p className="text-muted-foreground">
          Simule mensagens de pacientes para testar o sistema de detecção de confirmações
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Mensagens Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickMessages.map((quick, index) => {
            const Icon = quick.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => setFormData({ ...formData, message: quick.message })}
              >
                <Icon className={`w-5 h-5 mr-2 ${quick.color}`} />
                {quick.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Form */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Simular Mensagem</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="senderPhone">Teléfono do Paciente</Label>
            <Input
              id="senderPhone"
              value={formData.senderPhone}
              onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
              placeholder="5511999999999"
            />
          </div>

          <div>
            <Label htmlFor="senderName">Nome do Paciente</Label>
            <Input
              id="senderName"
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              placeholder="João Silva"
            />
          </div>

          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Digite a mensagem do paciente..."
              rows={4}
            />
          </div>

          <Button
            onClick={sendWebhookTest}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Enviar Mensagem de Teste
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Resultado do Teste</h2>
          
          {result.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span className="text-green-600 font-semibold">Mensagem processada com sucesso!</span>
              </div>

              {result.result && (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Intenção Detectada:</span>
                    <div className="mt-1">
                      {getIntentBadge(result.result.detectedIntent)}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Consulta Atualizada:</span>
                    <div className="mt-1">
                      {result.result.appointmentUpdated ? (
                        <span className="text-green-600 font-semibold">✅ Sim</span>
                      ) : (
                        <span className="text-orange-600">⚠️ Não (paciente não tem consulta agendada)</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Tempo de Processamento:</span>
                    <div className="mt-1">
                      <span className="font-mono">{result.result.processingTimeMs}ms</span>
                    </div>
                  </div>

                  {result.result.notificationSent && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        📧 Notificação enviada para secretária
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground block mb-2">Resposta Completa:</span>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="text-red-600 font-semibold">Error ao processar mensagem</span>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <span className="text-red-600 dark:text-red-400">
                  {result.error || "Error desconhecido"}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
