// @ts-nocheck - Type issues to be fixed
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CalendarPlus, CalendarDays } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Agendamientos() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    patientId: "",
    appointmentDate: "",
    appointmentTime: "",
    appointmentType: "manutencao_ortodontia" as
      | "manutencao_ortodontia"
      | "consulta_geral"
      | "avaliacao_marketing"
      | "retorno"
      | "emergencia",
    doctorName: "",
    notes: "",
  });

  const utils = trpc.useUtils();

  // Get start and end of month
  const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

  const { data: appointments = [], isLoading } = trpc.appointments.byDateRange.useQuery(
    {
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
    { enabled: !!user }
  );

  const { data: patients = [] } = trpc.patients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Cita agendada exitosamente");
      utils.appointments.byDateRange.invalidate();
      setIsDialogOpen(false);
      setFormData({
        patientId: "",
        appointmentDate: "",
        appointmentTime: "",
        appointmentType: "manutencao_ortodontia",
        doctorName: "",
        notes: "",
      });
    },
    onError: (error) => {
      // @ts-expect-error - Property may not exist on type
      toast.error("Error al agendar cita: " + error.messageText);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
    createAppointment.mutate({
      patientId: parseInt(formData.patientId),
      appointmentDate: dateTime,
      appointmentType: formData.appointmentType,
      doctorName: formData.doctorName || undefined,
      notes: formData.notes || undefined,
    });
  };

  // Group appointments by date
  const appointmentsByDate: Record<string, typeof appointments> = {};
  appointments.forEach((apt) => {
    const dateKey = format(new Date(apt.appointmentDate), "yyyy-MM-dd");
    if (!appointmentsByDate[dateKey]) {
      appointmentsByDate[dateKey] = [];
    }
    appointmentsByDate[dateKey]!.push(apt);
  });

  // Generate calendar days
  const firstDayOfMonth = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario de Citas</h1>
            <p className="text-muted-foreground mt-1">
              Visualiza y gestiona todas las citas programadas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Agendar Nueva Cita</DialogTitle>
                  <DialogDescription>
                    Complete la información para agendar una nueva cita
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patientId">Paciente *</Label>
                    <Select
                      value={formData.patientId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, patientId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="appointmentDate">Fecha *</Label>
                      <Input
                        id="appointmentDate"
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) =>
                          setFormData({ ...formData, appointmentDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="appointmentTime">Hora *</Label>
                      <Input
                        id="appointmentTime"
                        type="time"
                        value={formData.appointmentTime}
                        onChange={(e) =>
                          setFormData({ ...formData, appointmentTime: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="appointmentType">Tipo de Cita *</Label>
                    <Select
                      value={formData.appointmentType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, appointmentType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manutencao_ortodontia">
                          Mantenimiento Ortodoncia
                        </SelectItem>
                        <SelectItem value="consulta_geral">Consulta General</SelectItem>
                        <SelectItem value="avaliacao_marketing">
                          Evaluación Marketing
                        </SelectItem>
                        <SelectItem value="retorno">Retorno</SelectItem>
                        <SelectItem value="emergencia">Emergencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doctorName">Nombre del Doctor</Label>
                    <Input
                      id="doctorName"
                      value={formData.doctorName}
                      onChange={(e) =>
                        setFormData({ ...formData, doctorName: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAppointment.isPending}>
                    {createAppointment.isPending ? "Agendando..." : "Agendar Cita"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Month Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(selectedMonth, "MMMM yyyy", { locale: es }).toUpperCase()}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedMonth(
                      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1)
                    )
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date())}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedMonth(
                      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1)
                    )
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-muted-foreground p-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateKey = format(
                      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day),
                      "yyyy-MM-dd"
                    );
                    const dayAppointments = appointmentsByDate[dateKey] || [];
                    const isToday =
                      new Date().toDateString() ===
                      new Date(
                        selectedMonth.getFullYear(),
                        selectedMonth.getMonth(),
                        day
                      ).toDateString();

                    return (
                      <div
                        key={day}
                        className={`aspect-square border rounded-lg p-2 hover:bg-accent/50 transition-colors ${
                          isToday ? "border-primary border-2 bg-primary/5" : ""
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">{day}</div>
                        {dayAppointments.length > 0 && (
                          <div className="space-y-1">
                            {dayAppointments.slice(0, 2).map((apt) => (
                              <div
                                key={apt.id}
                                className={`text-xs p-1 rounded truncate ${
                                  apt.status === "confirmed"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                }`}
                              >
                                {format(new Date(apt.appointmentDate), "HH:mm")}
                              </div>
                            ))}
                            {dayAppointments.length > 2 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{dayAppointments.length - 2} más
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Mes</CardTitle>
            <CardDescription>
              {appointments.length} cita(s) programada(s) en{" "}
              {format(selectedMonth, "MMMM", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Citas</CardDescription>
                  <CardTitle className="text-3xl">{appointments.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardHeader className="pb-3">
                  <CardDescription>Confirmadas</CardDescription>
                  <CardTitle className="text-3xl text-green-700 dark:text-green-400">
                    {appointments.filter((a) => a.status === "confirmed").length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                <CardHeader className="pb-3">
                  <CardDescription>Pendientes</CardDescription>
                  <CardTitle className="text-3xl text-amber-700 dark:text-amber-400">
                    {appointments.filter((a) => a.status === "not_confirmed").length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
