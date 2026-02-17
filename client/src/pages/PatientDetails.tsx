// @ts-nocheck - Type issues to be fixed
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  DollarSign,
  MessageSquare,
  Edit
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function PatientDetails() {
  const [, navigate] = useLocation();
  const params = useParams();
  const patientId = parseInt(params.id || "0");

  const { data: patient, isLoading } = trpc.patients.getById.useQuery({ id: patientId });
  const { data: treatments } = trpc.treatments.listByPatient.useQuery({ patientId });
  const { data: appointments } = trpc.appointments.listByPatient.useQuery({ patientId });
  const { data: payments } = trpc.payments.listByPatient.useQuery({ patientId });
  const { data: communications } = trpc.communications.listByPatient.useQuery({ patientId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Paciente não encontrado</p>
          <Button onClick={() => navigate("/patients")} className="mt-4">
            Volver para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = {
    active: { label: "Activo", className: "bg-chart-4/10 text-chart-4" },
    inactive: { label: "Inactivo", className: "bg-muted text-muted-foreground" },
    defaulter: { label: "Inadimplente", className: "bg-destructive/10 text-destructive" },
    at_risk: { label: "Em Risco", className: "bg-orange-500/10 text-orange-600" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/patients")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{patient.fullName}</h1>
              <p className="text-muted-foreground mt-1">
                Cadastrado em {format(new Date(patient.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusConfig[patient.status].className}>
              {statusConfig[patient.status].label}
            </Badge>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Patient Info Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoItem label="Cédula de Identidad" value={patient.ci || "—"} />
              <InfoItem label="RG" value={patient.rg || "—"} />
              <InfoItem 
                label="Data de Nascimento" 
                value={patient.birthDate ? format(new Date(patient.birthDate), "dd/MM/yyyy", { locale: ptBR }) : "—"} 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoItem label="Teléfono" value={patient.phone || "—"} />
              <InfoItem label="Email" value={patient.email || "—"} />
              <InfoItem label="Contato de Emergência" value={patient.emergencyContact || "—"} />
              <InfoItem label="Tel. Emergência" value={patient.emergencyPhone || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoItem label="Dirección" value={patient.address || "—"} />
              <InfoItem label="Cidade" value={patient.city || "—"} />
              <InfoItem label="Estado" value={patient.state || "—"} />
              <InfoItem label="CEP" value={patient.zipCode || "—"} />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="treatments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="treatments" className="gap-2">
              <FileText className="w-4 h-4" />
              Tratamentos
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="w-4 h-4" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Comunicações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="treatments">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Tratamentos</CardTitle>
                <CardDescription>
                  Todos os tratamentos realizados e em andamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {treatments && treatments.length > 0 ? (
                  <div className="space-y-3">
                    {treatments.map((treatment) => (
                      <div key={treatment.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{treatment.treatmentType}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {treatment.description || "Sem descrição"}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {treatment.status === "in_progress" ? "Em Andamento" : 
                             treatment.status === "completed" ? "Completado" :
                             treatment.status === "planned" ? "Planejado" : "Cancelado"}
                          </Badge>
                        </div>
                        {treatment.totalCost && (
                          <p className="text-sm font-medium mt-2">
                            Valor: R$ {Number(treatment.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Ninguno tratamento registrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Consultas</CardTitle>
                <CardDescription>
                  Todas as consultas agendadas e realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments && appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(appointment.appointmentDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Duração: {appointment.duration} minutos
                          </p>
                        </div>
                        <Badge variant="outline">
                          {appointment.status === "confirmed" ? "Confirmado" :
                           appointment.status === "completed" ? "Realizado" :
                           appointment.status === "cancelled" ? "Cancelado" :
                           appointment.status === "no_show" ? "Faltou" : "Agendado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Ningunoa consulta registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Todos os pagamentos e pendências
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments && payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-4 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {format(new Date(payment.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {payment.paymentDate && (
                            <p className="text-sm text-muted-foreground">
                              Pago em: {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={
                          payment.status === "paid" ? "bg-chart-4/10 text-chart-4" :
                          payment.status === "overdue" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }>
                          {payment.status === "paid" ? "Pago" :
                           payment.status === "overdue" ? "Atrasado" :
                           payment.status === "cancelled" ? "Cancelado" : "Pendiente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Ninguno pagamento registrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Comunicações</CardTitle>
                <CardDescription>
                  Todas as mensagens enviadas ao paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {communications && communications.length > 0 ? (
                  <div className="space-y-3">
                    {communications.map((comm) => (
                      <div key={comm.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">
                            {comm.type === "email" ? "Email" :
                             comm.type === "sms" ? "SMS" : "WhatsApp"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comm.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {comm.subject && (
                          <p className="font-medium">{comm.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {comm.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Ningunoa comunicação registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
