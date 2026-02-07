import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Clock, User, Phone, Calendar, ArrowUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ListaEspera() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: waitingList, isLoading, refetch } = trpc.waitingList.list.useQuery();
  const { data: patients } = trpc.patients.list.useQuery();
  const addToWaitingList = trpc.waitingList.add.useMutation();
  const updateStatus = trpc.waitingList.updateStatus.useMutation();

  const [formData, setFormData] = useState({
    patientId: "",
    serviceType: "Ortodontia" as "Ortodontia" | "Clinico General",
    priority: "Media" as "Baja" | "Media" | "Alta",
    notes: "",
    preferredDates: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId) {
      toast.error("Por favor seleccione un paciente");
      return;
    }

    try {
      await addToWaitingList.mutateAsync({
        patientId: parseInt(formData.patientId),
        serviceType: formData.serviceType,
        priority: formData.priority,
        notes: formData.notes,
        preferredDate: formData.preferredDates,
      });

      toast.success("Paciente agregado a lista de espera");
      refetch();
      setIsDialogOpen(false);
      setFormData({
        patientId: "",
        serviceType: "Ortodontia",
        priority: "Media",
        notes: "",
        preferredDates: "",
      });
    } catch (error) {
      toast.error("Error al agregar a lista de espera");
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await updateStatus.mutateAsync({ id, status: "Cancelado" });
      toast.success("Paciente removido de lista de espera");
      refetch();
    } catch (error) {
      toast.error("Error al remover de lista de espera");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgente":
        return "destructive";
      case "Alta":
        return "default";
      case "Normal":
        return "secondary";
      case "Baja":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando lista de espera...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lista de Espera</h1>
            <p className="text-muted-foreground mt-2">
              Gestión de pacientes en espera de cita
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar a Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Paciente a Lista de Espera</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="patientId">Paciente *</Label>
                  <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName} - {patient.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio</Label>
                  <Select value={formData.serviceType} onValueChange={(value: any) => setFormData({ ...formData, serviceType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ortodontia">Ortodontia</SelectItem>
                      <SelectItem value="Clinico General">Clínico General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baja">Baja</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferredDate">Fecha Preferida</Label>
                  <Input
                    id="preferredDate"
                    value={formData.preferredDates}
                    onChange={(e) => setFormData({ ...formData, preferredDates: e.target.value })}
                    placeholder="Ej: Lunes y Miércoles por la tarde"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addToWaitingList.isPending}>
                    {addToWaitingList.isPending ? "Agregando..." : "Agregar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total en Espera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{waitingList?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alta Prioridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {waitingList?.filter((w) => w.priority === "Alta").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ortodontia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {waitingList?.filter((w) => w.serviceType === "Ortodontia").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waiting List */}
        <div className="space-y-3">
          {waitingList && waitingList.length > 0 ? (
            waitingList.map((item) => {
              const patient = patients?.find((p) => p.id === item.patientId);
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {patient?.firstName} {patient?.lastName}
                            </h3>
                            <Badge variant={getPriorityColor(item.priority)}>
                              {item.priority === "Alta" && <ArrowUp className="h-3 w-3 mr-1" />}
                              {item.priority}
                            </Badge>
                            <Badge variant="outline">{item.serviceType}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{patient?.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Agregado: {new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            {item.preferredDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{typeof item.preferredDate === 'string' ? item.preferredDate : ''}</span>
                              </div>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleRemove(item.id)}
                        disabled={updateStatus.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay pacientes en lista de espera</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
