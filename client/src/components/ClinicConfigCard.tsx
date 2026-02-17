import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2 } from 'lucide-react';

export default function ClinicConfigCard() {
  const [clinicName, setClinicName] = useState('');
  const [clinicWhatsAppPhone, setClinicWhatsAppPhone] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load existing config
  const { data: config, refetch } = trpc.clinicConfig.get.useQuery();

  // Update mutation
  const updateMutation = trpc.clinicConfig.update.useMutation({
    onSuccess: () => {
      alert('✅ Configuración salva com sucesso!');
      refetch();
    },
    onError: (error) => {
      alert(`❌ Error ao salvar: ${error.message}`);
    },
  });

  // Load config into form
  useEffect(() => {
    if (config) {
      setClinicName(config.clinicName);
      setClinicWhatsAppPhone(config.clinicWhatsAppPhone);
      setNotificationsEnabled(config.notificationsEnabled);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clinicName.trim() || !clinicWhatsAppPhone.trim()) {
      alert('⚠️ Por favor, preencha todos os campos obrigatórios');
      return;
    }

    updateMutation.mutate({
      clinicName,
      clinicWhatsAppPhone,
      notificationsEnabled,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Configuración do WhatsApp Clínica
        </CardTitle>
        <CardDescription>
          Configure o número corporativo da clínica para receber notificações de reagendamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Nome da Clínica *</Label>
            <Input
              id="clinicName"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Ex: Odonto Chin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicWhatsAppPhone">Número WhatsApp Corporativo *</Label>
            <Input
              id="clinicWhatsAppPhone"
              value={clinicWhatsAppPhone}
              onChange={(e) => setClinicWhatsAppPhone(e.target.value)}
              placeholder="Ex: +5511999999999"
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato internacional com código do país (ex: +55 para Brasil)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notificações Ativadas</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações quando pacientes solicitarem reagendamento
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ Importante:</strong> Este é o número corporativo da clínica onde as secretarias
              receberão notificações automáticas quando um paciente solicitar espontaneamente reagendar
              sua consulta. O sistema detecta palavras-chave como "reagendar", "cambiar", "no puedo", etc.
            </p>
          </div>

          <Button type="submit" disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? 'Salvando...' : 'Guardar Configuración'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
