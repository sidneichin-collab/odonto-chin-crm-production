// @ts-nocheck - Type issues to be fixed
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KanbanBoard, AppointmentEstado, KanbanAppointment } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function KanbanView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedChair, setSelectedChair] = useState<number | 'all'>('all');
  const utils = trpc.useUtils();

  const { data: appointments, isLoading } = trpc.appointments.getByDate.useQuery({
    date: format(selectedDate, 'yyyy-MM-dd'),
  });

  const updateEstadoMutation = trpc.appointments.updateEstado.useMutation({
    onSuccess: () => {
      utils.appointments.getByDate.invalidate();
      toast.success('Estado actualizado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.messageText}`);
    },
  });

  const handleEstadoChange = async (appointmentId: number, newEstado: AppointmentEstado) => {
    await updateEstadoMutation.mutateAsync({
      appointmentId,
      status: newEstado,
    });
  };

  // Filter by chair if selected
  const filteredAppointments = selectedChair === 'all' 
    ? appointments 
    : appointments?.filter(apt => apt.chair === selectedChair);

  const kanbanAppointments: KanbanAppointment[] = filteredAppointments?.map((apt) => ({
    id: apt.id,
    patientId: apt.patientId,
    patientName: (apt.patientName || "Paciente") || 'Sin nombre',
    patientPhone: apt.phone || apt.patientPhone || "N/A" || 'Sin teléfono',
    appointmentDate: new Date(apt.appointmentDate),
    treatmentType: apt.appointmentType === 'orthodontic_treatment' 
      ? 'Ortodoncia' 
      : apt.appointmentType === 'general_clinic' 
      ? 'Clínico General' 
      : 'Evaluación Marketing',
    status: apt.status as AppointmentEstado,
    notes: apt.notes || undefined,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vista Kanban de Citas</h1>
          <p className="text-muted-foreground">
            Arrastra las citas entre columnas para cambiar su estado
          </p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedChair}
            onChange={(e) => setSelectedChair(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Todos los Sillones</option>
            <option value="1">Sillón 1 - Ortodoncia</option>
            <option value="2">Sillón 2 - Ortodoncia</option>
            <option value="3">Sillón 3 - Ortodoncia</option>
            <option value="4">Sillón 4 - Clínico Geral</option>
          </select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <KanbanBoard 
          appointments={kanbanAppointments} 
          onEstadoChange={handleEstadoChange}
        />
      )}
    </div>
  );
}
