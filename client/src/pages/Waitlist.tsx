// @ts-nocheck - Type issues to be fixed
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Clock, Phone, Calendar, Trash2, Bell, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Waitlist() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<"marketing_evaluation" | "orthodontic_treatment" | "general_clinic" | "all">("all");
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [availableDate, setAvailableDate] = useState("");
  const [availableTime, setAvailableTime] = useState("");

  const { data: waitlistData, refetch } = trpc.waitlist.getAll.useQuery();
  const removeFromWaitlist = trpc.waitlist.remove.useMutation();
  const notifyAvailable = trpc.waitlist.notifyAvailable.useMutation();

  const filteredData = waitlistData?.filter((entry) => {
    if (selectedType === "all") return true;
    return entry.appointmentType === selectedType;
  });

  const handleRemove = async (waitlistId: number, patientName: string) => {
    try {
      await removeFromWaitlist.mutateAsync({ waitlistId });
      toast.success(`${patientName} removido da lista de espera`);
      refetch();
    } catch (error) {
      toast.error("Error ao remover da lista de espera");
    }
  };

  const handleNotify = (entry: any) => {
    setSelectedEntry(entry);
    setNotifyDialogOpen(true);
  };

  const handleSendNotification = async () => {
    if (!selectedEntry || !availableDate || !availableTime) {
      toast.error("Preencha data e horário disponível");
      return;
    }

    try {
      const result = await notifyAvailable.mutateAsync({
        appointmentType: selectedEntry.appointmentType,
        availableDate,
        availableTime,
      });

      if (result.success) {
        toast.success(result.messageText);
        setNotifyDialogOpen(false);
        setAvailableDate("");
        setAvailableTime("");
        refetch();
      } else {
        toast.error(result.messageText);
      }
    } catch (error) {
      toast.error("Error ao enviar notificação");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista de Espera Inteligente</h1>
          <p className="text-muted-foreground">
            Gerencie pacientes aguardando vagas disponíveis
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={selectedType === "all" ? "default" : "outline"}
          onClick={() => setSelectedType("all")}
        >
          Todos ({waitlistData?.length || 0})
        </Button>
        <Button
          variant={selectedType === "orthodontic_treatment" ? "default" : "outline"}
          onClick={() => setSelectedType("orthodontic_treatment")}
        >
          Ortodontia ({waitlistData?.filter((e) => e.appointmentType === "orthodontic_treatment").length || 0})
        </Button>
        <Button
          variant={selectedType === "general_clinic" ? "default" : "outline"}
          onClick={() => setSelectedType("general_clinic")}
        >
          Clínico Geral ({waitlistData?.filter((e) => e.appointmentType === "general_clinic").length || 0})
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total na Lista</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitlistData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Pacientes aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {waitlistData?.filter((e) => e.priority === "high").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortodontia</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {waitlistData?.filter((e) => e.appointmentType === "orthodontic_treatment").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando vaga</p>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist Entries */}
      <div className="space-y-4">
        {filteredData && filteredData.length > 0 ? (
          filteredData.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {(entry.patientName || "Paciente")}
                      <Badge variant={getPriorityColor(entry.priority)}>
                        {getPriorityLabel(entry.priority)}
                      </Badge>
                      <Badge variant="outline">
                        {entry.appointmentType === "orthodontic_treatment" ? "Ortodontia" : entry.appointmentType === "general_clinic" ? "Clínico Geral" : "Primeira Consulta"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {entry.phone || entry.patientPhone || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Na lista desde {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleNotify(entry)}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Notificar Vaga
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(entry.id, (entry.patientName || "Paciente") || "")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {entry.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Ninguno paciente na lista de espera</p>
              <p className="text-sm text-muted-foreground">
                Quando houver cancelamentos, você poderá notificar pacientes desta lista
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notify Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notificar Vaga Disponível</DialogTitle>
            <DialogDescription>
              Enviar notificação para {selectedEntry?.patientName} sobre vaga disponível
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Data Disponível</Label>
              <Input
                id="date"
                type="date"
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time">Horário Disponível</Label>
              <Input
                id="time"
                type="time"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendNotification}>
              Enviar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
