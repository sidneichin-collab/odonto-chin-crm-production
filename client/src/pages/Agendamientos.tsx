import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Calendar as CalendarIcon, User, Clock, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

type AppointmentStatus = "Pendiente" | "Confirmado" | "En Tratamiento" | "Completado" | "Cancelado" | "No Asistió";

export default function Agendamientos() {
  const [selectedType, setSelectedType] = useState<"Ortodontia" | "Clinico General">("Ortodontia");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery({ type: selectedType });
  const { data: patients } = trpc.patients.list.useQuery();
  const createAppointment = trpc.appointments.create.useMutation();
  const updateStatus = trpc.appointments.updateStatus.useMutation();

  const [formData, setFormData] = useState({
    patientId: "",
    title: "",
    description: "",
    appointmentDate: "",
    appointmentTime: "",
    duration: 30,
    dentistName: "",
    notes: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: { id: AppointmentStatus; title: string; color: string }[] = [
    { id: "Pendiente", title: "Pendiente", color: "bg-yellow-500/10 border-yellow-500/20" },
    { id: "Confirmado", title: "Confirmado", color: "bg-green-500/10 border-green-500/20" },
    { id: "En Tratamiento", title: "En Tratamiento", color: "bg-blue-500/10 border-blue-500/20" },
    { id: "Completado", title: "Completado", color: "bg-gray-500/10 border-gray-500/20" },
  ];

  const getAppointmentsByStatus = (status: AppointmentStatus) => {
    return appointments?.filter((apt) => apt.status === status) || [];
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = parseInt(active.id as string);
    const newStatus = over.id as AppointmentStatus;

    try {
      await updateStatus.mutateAsync({
        id: appointmentId,
        status: newStatus,
      });
      toast.success("Estado actualizado exitosamente");
      refetch();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      const appointmentDateTime = `${formData.appointmentDate}T${formData.appointmentTime}:00`;
      
      await createAppointment.mutateAsync({
        patientId: parseInt(formData.patientId),
        type: selectedType,
        title: formData.title || `Cita ${selectedType}`,
        description: formData.description,
        appointmentDate: appointmentDateTime,
        duration: formData.duration,
        dentistName: formData.dentistName,
        notes: formData.notes,
      });

      toast.success("Cita agendada exitosamente");
      refetch();
      setIsDialogOpen(false);
      setFormData({
        patientId: "",
        title: "",
        description: "",
        appointmentDate: "",
        appointmentTime: "",
        duration: 30,
        dentistName: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Error al agendar cita");
    }
  };

  const activeAppointment = appointments?.find((apt) => apt.id === parseInt(activeId || "0"));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando agendamientos...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Agendamientos</h1>
            <p className="text-muted-foreground mt-2">
              Sistema Kanban para gestión de citas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Cita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agendar Nueva Cita</DialogTitle>
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
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={`Cita ${selectedType}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentDate">Fecha *</Label>
                    <Input
                      id="appointmentDate"
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointmentTime">Hora *</Label>
                    <Input
                      id="appointmentTime"
                      type="time"
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duración (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      min="15"
                      step="15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dentistName">Dentista</Label>
                    <Input
                      id="dentistName"
                      value={formData.dentistName}
                      onChange={(e) => setFormData({ ...formData, dentistName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAppointment.isPending}>
                    {createAppointment.isPending ? "Agendando..." : "Agendar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Type Tabs */}
        <Tabs value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
          <TabsList>
            <TabsTrigger value="Ortodontia">Ortodontia</TabsTrigger>
            <TabsTrigger value="Clinico General">Clínico General</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-4 gap-4">
                {columns.map((column) => (
                  <Card key={column.id} className={`${column.color} border-2`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span>{column.title}</span>
                        <Badge variant="secondary">{getAppointmentsByStatus(column.id).length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[400px]">
                      {getAppointmentsByStatus(column.id).map((appointment) => {
                        const patient = patients?.find((p) => p.id === appointment.patientId);
                        return (
                          <Card
                            key={appointment.id}
                            className="cursor-move hover:shadow-md transition-shadow bg-card"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/html", appointment.id.toString());
                              handleDragStart({ active: { id: appointment.id.toString() } } as DragStartEvent);
                            }}
                            onDragEnd={() => setActiveId(null)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const draggedId = e.dataTransfer.getData("text/html");
                              handleDragEnd({
                                active: { id: draggedId },
                                over: { id: column.id },
                              } as DragEndEvent);
                            }}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">
                                  {patient?.firstName} {patient?.lastName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {patient?.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{patient.phone}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DragOverlay>
                {activeId && activeAppointment ? (
                  <Card className="cursor-move shadow-lg bg-card opacity-90">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">
                          {patients?.find((p) => p.id === activeAppointment.patientId)?.firstName}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
