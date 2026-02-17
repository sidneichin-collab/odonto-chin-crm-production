import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, CheckCircle2, Clock, XCircle, RefreshCw, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { PatientListModal } from "@/components/PatientListModal";
import { WhatsAppMessageComposer } from "@/components/WhatsAppMessageComposer";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MonitoreoRecordatorios() {
  const { data: stats, isLoading: statsLoading } = trpc.reminders.getStats.useQuery();
  const { data: queue, isLoading: queueLoading } = trpc.reminders.getQueue.useQuery();
  const { data: channels, isLoading: channelsLoading } = trpc.reminders.getChannels.useQuery();
  
  const [selectedStatus, setSelectedStatus] = useState<"confirmed" | "pending" | "no_answer" | "reschedule" | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleCardClick = (status: "confirmed" | "pending" | "no_answer" | "reschedule") => {
    setSelectedStatus(status);
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setShowComposer(true);
  };

  if (statsLoading || queueLoading || channelsLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalConfirmed = stats?.confirmed || 0;
  const totalPending = stats?.pending || 0;
  const totalNoAnswer = stats?.noAnswer || 0;
  const totalReschedule = stats?.reschedule || 0;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Monitoreo de Recordatorios</h1>
        <p className="text-muted-foreground mt-2">
          Estadísticas y estado de envío de recordatorios automáticos
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Stats and Content */}
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-green-600/20 border-green-500 hover:bg-green-600/30"
              onClick={() => handleCardClick("confirmed")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConfirmed}</div>
                <p className="text-xs text-muted-foreground">
                  Pacientes que confirmaron
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-orange-600/20 border-orange-500 hover:bg-orange-600/30"
              onClick={() => handleCardClick("pending")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPending}</div>
                <p className="text-xs text-muted-foreground">
                  Esperando respuesta
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-red-600/20 border-red-500 hover:bg-red-600/30"
              onClick={() => handleCardClick("no_answer")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">No Contestaron</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNoAnswer}</div>
                <p className="text-xs text-muted-foreground">
                  Sin respuesta
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-purple-600/20 border-purple-500 hover:bg-purple-600/30"
              onClick={() => handleCardClick("reschedule")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reagendarán</CardTitle>
                <RefreshCw className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReschedule}</div>
                <p className="text-xs text-muted-foreground">
                  Solicitan reagendar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp Channel Health */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                <CardTitle>Salud de los Canales WhatsApp</CardTitle>
              </div>
              <CardDescription>
                Uso diario de mensajes por número (límite: 1000 msgs/día)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channels && channels.length > 0 ? (
                  channels.map((channel: any) => {
                    const usage = (channel.dailyMessageCount / 1000) * 100;
                    const statusColor = usage > 80 ? 'destructive' : usage > 50 ? 'warning' : 'default';
                    
                    return (
                      <div key={channel.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusColor as any}>
                              {channel.status}
                            </Badge>
                            <span className="font-medium">{channel.instanceName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {channel.dailyMessageCount} / {channel.dailyLimit}
                          </span>
                        </div>
                        <Progress value={usage} className="h-2" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No hay canales WhatsApp conectados</p>
                    <p className="text-sm mt-1">Conecta números en la página de Canales</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <CardTitle>Cola de Mensajes Programadas</CardTitle>
              </div>
              <CardDescription>
                Próximos recordatorios agendados para envío
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queue && queue.length > 0 ? (
                <div className="space-y-3">
                  {queue.slice(0, 10).map((item: any) => (
                    <div key={`queue-${item.id}-${item.scheduledFor}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.patientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.messageType} • {item.phone}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(item.scheduledFor).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No hay mensajes programados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Calendar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleccionar Fecha</CardTitle>
              <CardDescription>Filtrar recordatorios por día</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                locale={es}
              />
            </CardContent>
          </Card>

          {/* Date Display */}
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Fecha Seleccionada</div>
                <div className="text-xl font-bold">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {format(selectedDate, "yyyy", { locale: es })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {selectedStatus && (
        <PatientListModal
          open={!!selectedStatus}
          onClose={() => setSelectedStatus(null)}
          status={selectedStatus === "confirmed" ? "confirmed" : selectedStatus === "pending" ? "pending" : selectedStatus === "no_answer" ? "failed" : "sent"}
          onPatientSelect={handlePatientSelect}
        />
      )}

      {showComposer && selectedPatient && (
        <WhatsAppMessageComposer
          open={showComposer}
          onClose={() => {
            setShowComposer(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
        />
      )}
    </div>
  );
}
