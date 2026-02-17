/**
 * Canales Page
 * Gerenciamento de canais de comunicação WhatsApp
 * 
 * Arquitetura:
 * 1. Canal Integración Clínica - Número principal da clínica (futuro)
 * 2. Canal de Recordatórios - Números dedicados para mass messaging (Evolution API)
 */

import { useState } from 'react';
import { Plus, Smartphone, Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, Trash2, QrCode } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Canales() {
  // Using sonner toast
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [qrDialogInstance, setQrDialogInstance] = useState<string | null>(null);

  // Form state
  const [numberName, setNumberName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [channelType, setChannelType] = useState<'integration' | 'reminders'>('reminders');

  // Queries
  const { data: integrationNumbers = [], refetch: refetchIntegration } = trpc.reminders.getWhatsAppNumbers.useQuery({ 
    channelType: 'integration' 
  });
  
  const { data: reminderNumbers = [], refetch: refetchReminders } = trpc.reminders.getWhatsAppNumbers.useQuery({ 
    channelType: 'reminders' 
  });

  const { data: stats } = trpc.reminders.getReminderStats.useQuery({});

  // Mutations
  const addNumber = trpc.reminders.addWhatsAppNumber.useMutation({
    onSuccess: () => {
      toast.success('✅ Número agregado', {
        description: 'Ahora escanea el QR Code para conectar WhatsApp'
      });
      refetchIntegration();
      refetchReminders();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('❌ Error: ' + error.message);
    }
  });

  const disconnectNumber = trpc.reminders.disconnectNumber.useMutation({
    onSuccess: () => {
      toast.success('✅ Número desconectado');
      refetchIntegration();
      refetchReminders();
    },
    onError: (error) => {
      toast.error('❌ Error: ' + error.message);
    }
  });

  const removeNumber = trpc.reminders.removeNumber.useMutation({
    onSuccess: () => {
      toast.success('✅ Número eliminado');
      refetchIntegration();
      refetchReminders();
    },
    onError: (error) => {
      toast.error('❌ Error: ' + error.message);
    }
  });

  const resetForm = () => {
    setNumberName('');
    setPhoneNumber('');
    setCountry('');
    setChannelType('reminders');
  };

  const handleAddNumber = () => {
    if (!numberName || !phoneNumber || !country) {
      toast.error('⚠️ Por favor completa todos los campos');
      return;
    }

    const instanceName = `${country.toLowerCase()}-${channelType}-${Date.now()}`;
    
    addNumber.mutate({
      numberName,
      phoneNumber,
      country,
      channelType,
      instanceName,
      dailyLimit: 1000
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactivo</Badge>;
      case 'blocked':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Bloqueado</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Advertencia</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTodayUsage = (instanceName: string) => {
    const usage = stats?.numberUsage?.find((u: any) => u.whatsappNumber === instanceName);
    return usage?.count || 0;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canales de Comunicación</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los números WhatsApp para integración y recordatórios
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Conectar Número WhatsApp
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar Número WhatsApp</DialogTitle>
              <DialogDescription>
                Agrega un nuevo número WhatsApp para comunicación
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="numberName">Nombre del Número</Label>
                <Input
                  id="numberName"
                  placeholder="Ej: Bolivia Recordatórios 1"
                  value={numberName}
                  onChange={(e) => setNumberName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Número de Teléfono</Label>
                <Input
                  id="phoneNumber"
                  placeholder="Ej: +591 12345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="country">País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Selecciona país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bolivia">🇧🇴 Bolivia</SelectItem>
                    <SelectItem value="Paraguay">🇵🇾 Paraguay</SelectItem>
                    <SelectItem value="Panama">🇵🇦 Panamá</SelectItem>
                    <SelectItem value="Chile">🇨🇱 Chile</SelectItem>
                    <SelectItem value="Uruguay">🇺🇾 Uruguay</SelectItem>
                    <SelectItem value="Colombia">🇨🇴 Colombia</SelectItem>
                    <SelectItem value="Peru">🇵🇪 Perú</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="channelType">Tipo de Canal</Label>
                <Select value={channelType} onValueChange={(v: any) => setChannelType(v)}>
                  <SelectTrigger id="channelType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="integration">
                      🏥 Canal Integración Clínica (comunicación principal)
                    </SelectItem>
                    <SelectItem value="reminders">
                      📱 Canal de Recordatórios (envíos masivos)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAddNumber} 
                className="w-full"
                disabled={addNumber.isPending}
              >
                {addNumber.isPending ? 'Agregando...' : 'Agregar Número'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integration">
            🏥 Canal Integración Clínica ({integrationNumbers.length})
          </TabsTrigger>
          <TabsTrigger value="reminders">
            📱 Canal de Recordatórios ({reminderNumbers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canal Integración Clínica</CardTitle>
              <CardDescription>
                Números principales de las clínicas para comunicación general con pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrationNumbers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay números de integración configurados</p>
                  <p className="text-sm mt-2">Agrega el número principal de tu clínica</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {integrationNumbers.map((num: any) => (
                    <NumberCard
                      key={num.id}
                      number={num}
                      onDisconnect={() => disconnectNumber.mutate({ instanceName: num.instanceName })}
                      onRemove={() => removeNumber.mutate({ id: num.id, instanceName: num.instanceName })}
                      onShowQR={() => setQrDialogInstance(num.instanceName)}
                      getStatusBadge={getStatusBadge}
                      getTodayUsage={getTodayUsage}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canal de Recordatórios (Evolution API)</CardTitle>
              <CardDescription>
                Números dedicados exclusivamente para recordatórios automáticos y envíos masivos.
                Límite: 1000 mensajes/día por número.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reminderNumbers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay números de recordatórios configurados</p>
                  <p className="text-sm mt-2">Agrega números dedicados para envíos masivos</p>
                  <p className="text-xs mt-1 text-yellow-600">
                    Recomendado: 30 Bolivia, 10 Paraguay, 1 Panamá, 1 Chile
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminderNumbers.map((num: any) => (
                    <NumberCard
                      key={num.id}
                      number={num}
                      onDisconnect={() => disconnectNumber.mutate({ instanceName: num.instanceName })}
                      onRemove={() => removeNumber.mutate({ id: num.id, instanceName: num.instanceName })}
                      onShowQR={() => setQrDialogInstance(num.instanceName)}
                      getStatusBadge={getStatusBadge}
                      getTodayUsage={getTodayUsage}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      {qrDialogInstance && (
        <QRCodeDialog
          instanceName={qrDialogInstance}
          onClose={() => setQrDialogInstance(null)}
        />
      )}
    </div>
  );
}

// ==================== COMPONENTS ====================

function NumberCard({ 
  number, 
  onDisconnect, 
  onRemove, 
  onShowQR,
  getStatusBadge,
  getTodayUsage
}: any) {
  const usage = getTodayUsage(number.instanceName);
  const usagePercent = (usage / number.dailyLimit) * 100;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{number.numberName}</h3>
                {getStatusBadge(number.status)}
              </div>
              <p className="text-sm text-muted-foreground">{number.phoneNumber}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>🌎 {number.country}</span>
                <span>📊 {usage}/{number.dailyLimit} msgs hoy ({usagePercent.toFixed(0)}%)</span>
              </div>
              {number.lastUsedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Último uso: {new Date(number.lastUsedAt).toLocaleString('es')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {number.status === 'inactive' && (
              <Button size="sm" variant="outline" onClick={onShowQR}>
                <QrCode className="w-4 h-4 mr-1" />
                QR Code
              </Button>
            )}
            {number.status === 'active' && (
              <Button size="sm" variant="outline" onClick={onDisconnect}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Desconectar
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={onRemove}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                usagePercent > 90 ? 'bg-red-500' : 
                usagePercent > 70 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QRCodeDialog({ instanceName, onClose }: { instanceName: string; onClose: () => void }) {
  const { data: qrData, isLoading, error } = trpc.reminders.getQRCode.useQuery({ instanceName });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanea el QR Code</DialogTitle>
          <DialogDescription>
            Abre WhatsApp en tu teléfono y escanea este código para conectar
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6">
          {isLoading && (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando QR Code...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-destructive">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <p className="text-sm">{error.message}</p>
            </div>
          )}

          {qrData?.base64 && (
            <div className="space-y-4">
              <img 
                src={`data:image/png;base64,${qrData.base64}`} 
                alt="QR Code" 
                className="w-64 h-64 border-4 border-primary rounded-lg"
              />
              <p className="text-xs text-center text-muted-foreground">
                El código expira en 60 segundos
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
