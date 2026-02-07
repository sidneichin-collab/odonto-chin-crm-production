import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, User, Phone, Mail, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function PacientesRiesgo() {
  const { data: patients, isLoading, refetch } = trpc.patients.atRisk.useQuery();
  const markAsContacted = trpc.patients.update.useMutation();

  const handleContact = async (patientId: number) => {
    try {
      await markAsContacted.mutateAsync({
        id: patientId,
        isAtRisk: false,
      });
      toast.success("Paciente marcado como contactado");
      refetch();
    } catch (error) {
      toast.error("Error al actualizar paciente");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando pacientes en riesgo...</p>
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
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Pacientes en Riesgo
          </h1>
          <p className="text-muted-foreground mt-2">
            Pacientes que requieren atención inmediata
          </p>
        </div>

        {/* Alert Card */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Estos pacientes han sido identificados como en riesgo de incumplimiento. 
              Es importante contactarlos lo antes posible para confirmar sus citas y 
              recordarles la importancia del tratamiento.
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total en Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {patients?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ortodontia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.floor((patients?.length || 0) * 0.6)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clínico General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.ceil((patients?.length || 0) * 0.4)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {patients && patients.length > 0 ? (
            patients.map((patient: any) => (
              <Card key={patient.id} className="border-destructive/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-8 w-8 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            En Riesgo
                          </Badge>
                          <Badge variant="outline">{patient.status}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{patient.phone}</span>
                          </div>
                          {patient.whatsappNumber && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              <span>{patient.whatsappNumber}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{patient.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Requiere seguimiento</span>
                          </div>
                        </div>

                        {patient.riskReason && (
                          <div className="p-3 bg-destructive/10 rounded-lg mb-3">
                            <p className="text-sm font-medium text-destructive">
                              Motivo: {patient.riskReason}
                            </p>
                          </div>
                        )}

                        {patient.notes && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Notas:</span> {patient.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          if (patient.whatsappNumber) {
                            window.open(`https://wa.me/${patient.whatsappNumber.replace(/\D/g, '')}`, '_blank');
                          } else {
                            toast.error("No hay número de WhatsApp registrado");
                          }
                        }}
                        className="gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Contactar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContact(patient.id)}
                        disabled={markAsContacted.isPending}
                      >
                        Marcar Contactado
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay pacientes en riesgo en este momento
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  ¡Excelente trabajo manteniendo a los pacientes comprometidos!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
