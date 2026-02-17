import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, Server } from "lucide-react";

export function EmailConfigCard() {
  const { data: config, isLoading, refetch } = trpc.emailConfig.get.useQuery();
  const updateMutation = trpc.emailConfig.update.useMutation();

  const [formData, setFormData] = useState({
    clinicName: "",
    emailAddress: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    isActive: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        clinicName: config.clinicName,
        emailAddress: config.emailAddress,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        isActive: config.isActive,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
      alert("Configuración guardada exitosamente!");
      refetch();
    } catch (error) {
      alert("Error al guardar configuración");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Configuración de Email (SMTP)</CardTitle>
        </div>
        <CardDescription>
          Configure las credenciales SMTP para enviar recordatorios por email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Nombre de la Clínica</Label>
              <Input
                id="clinicName"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                placeholder="Odonto Chin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailAddress">Email de la Clínica</Label>
              <Input
                id="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                placeholder="contacto@odontochin.com"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Configuración del Servidor SMTP</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Ejemplo: smtp.gmail.com, smtp.office365.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                placeholder="587"
                required
              />
              <p className="text-xs text-muted-foreground">
                Común: 587 (TLS), 465 (SSL), 25
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuario SMTP</Label>
              <Input
                id="smtpUser"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="usuario@gmail.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Contraseña SMTP</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-muted-foreground">
                Para Gmail: usar "App Password", no la contraseña normal
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Habilitar Envío de Emails</Label>
              <p className="text-sm text-muted-foreground">
                Activar/desactivar el envío automático de recordatorios por email
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Configuración
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
