// @ts-nocheck
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { AgendaKanban } from '@/components/AgendaKanban';
import { NewAppointmentDialog } from '@/components/NewAppointmentDialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Search, Plus } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function AgendaView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: appointments, isLoading } = trpc.appointments.getByDate.useQuery({
    date: format(selectedDate, 'yyyy-MM-dd'),
  });

  const updateAppointmentMutation = trpc.appointments.updateAppointmentTimeAndChair.useMutation({
    onSuccess: () => {
      utils.appointments.getByDate.invalidate();
      toast.success('Cita movida correctamente');
    },
    onError: (error) => {
      // @ts-expect-error - Property may not exist on type
      toast.error(`Error al mover cita: ${error.messageText}`);
    },
  });

  const updateDoctorMutation = trpc.chairs.updateDoctor.useMutation({
    onSuccess: () => {
      toast.success('Doctor actualizado correctamente');
    },
    onError: (error) => {
      // @ts-expect-error - Property may not exist on type
      toast.error(`Error al actualizar doctor: ${error.messageText}`);
    },
  });

  const handleAppointmentMove = async (
    appointmentId: number,
    newTime: string,
    newChair: string
  ) => {
    const [hours, minutes] = newTime.split(':');
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    await updateAppointmentMutation.mutateAsync({
      appointmentId,
      appointmentDate: newDateTime.toISOString(),
      chair: newChair,
    });
  };

  const handleDoctorUpdate = async (chairId: string, doctorName: string) => {
    await updateDoctorMutation.mutateAsync({
      chairId,
      doctorName,
      date: format(selectedDate, 'yyyy-MM-dd'),
    });
  };

  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Transform appointments to match AgendaKanban format
  const agendaAppointments = appointments?.map((apt) => ({
    id: apt.id,
    // @ts-expect-error - Property may not exist on type
    patientName: (apt.patientName || "Paciente") || 'Sin nombre',
    // @ts-expect-error - Property may not exist on type
    patientPhone: apt.phone || apt.patientPhone || "N/A" || 'Sin teléfono',
    time: format(new Date(apt.appointmentDate), 'HH:mm'),
    chair: apt.chair || 'sillon_1_oro',
    status: apt.status as 'confirmed' | 'not_confirmed' | 'cancelled',
    notes: apt.notes || undefined,
  })) || [];

  return (
    <div className="flex gap-4">
      {/* Main Content */}
      <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isToday ? 'default' : 'outline'}
            size="sm"
            onClick={goToToday}
            className="min-w-[80px]"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Hoy
          </Button>

          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente por nombre, teléfono o CI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsNewAppointmentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agendar Paciente
          </Button>
        </div>

        {/* Agenda Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AgendaKanban
            appointments={agendaAppointments}
            onAppointmentMove={handleAppointmentMove}
            onDoctorUpdate={handleDoctorUpdate}
          />
        )}
      </div>

      {/* Sidebar with Calendar */}
      <div className="w-80 space-y-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Calendario</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={es}
            className="rounded-md border-0"
          />
        </div>
      </div>

      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
        selectedDate={selectedDate}
      />
    </div>
  );
}
