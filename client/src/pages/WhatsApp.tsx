import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Send, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WhatsApp() {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [message, setMessage] = useState("");

  const { data: messages, isLoading, refetch } = trpc.whatsapp.messages.useQuery();
  const { data: patients } = trpc.patients.list.useQuery();
  const sendMessage = trpc.whatsapp.sendReminder.useMutation();

  const handleSend = async () => {
    if (!selectedPatient || !message.trim()) {
      toast.error("Por favor seleccione un paciente y escriba un mensaje");
      return;
    }

    const patient = patients?.find((p) => p.id === parseInt(selectedPatient));
    if (!patient?.whatsappNumber) {
      toast.error("El paciente no tiene número de WhatsApp registrado");
      return;
    }

    try {
      await sendMessage.mutateAsync({
        appointmentId: 0,
        patientId: parseInt(selectedPatient),
        phoneNumber: patient.whatsappNumber,
        messageContent: message.trim(),
      });

      toast.success("Mensaje enviado exitosamente");
      setMessage("");
      setSelectedPatient("");
      refetch();
    } catch (error) {
      toast.error("Error al enviar mensaje");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Enviado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "Pendiente":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Enviado":
        return "default";
      case "Error":
        return "destructive";
      case "Pendiente":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando mensajes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-green-500" />
            WhatsApp
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión de mensajes y recordatorios automáticos
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {messages?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Exitosos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {messages?.filter((m) => m.status === "Enviado").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {messages?.filter((m) => m.status === "Pendiente").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fallidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {messages?.filter((m) => m.status === "Error").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Send Message Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enviar Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patient">Paciente</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.filter((p) => p.whatsappNumber).map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName} - {patient.whatsappNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Escriba su mensaje aquí..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length} caracteres
              </p>
            </div>

            <Button
              onClick={handleSend}
              disabled={sendMessage.isPending || !selectedPatient || !message.trim()}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {sendMessage.isPending ? "Enviando..." : "Enviar Mensaje"}
            </Button>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              Estado de Integración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <p className="font-medium">Evolution API</p>
                  <p className="text-sm text-muted-foreground">http://95.111.240.243:8080</p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <p className="font-medium">Sistema Anti-Bloqueo</p>
                  <p className="text-sm text-muted-foreground">Control de pulso activado</p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <p className="font-medium">N8N Automations</p>
                  <p className="text-sm text-muted-foreground">Recordatorios programados</p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            {messages && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.slice(0, 10).map((msg) => {
                  const patient = patients?.find((p) => p.id === msg.patientId);
                  return (
                    <div key={msg.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {patient?.firstName} {patient?.lastName}
                          </span>
                          <Badge variant={getStatusColor(msg.status)} className="gap-1">
                            {getStatusIcon(msg.status)}
                            {msg.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{msg.phoneNumber}</p>
                        <p className="text-sm">{msg.messageContent}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'Fecha no disponible'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay mensajes enviados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
