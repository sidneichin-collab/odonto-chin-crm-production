// @ts-nocheck
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedChair?: string;
  selectedTime?: string;
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedChair,
  selectedTime,
}: NewAppointmentDialogProps) {
  const [appointmentDate, setAppointmentDate] = useState<Date>(selectedDate);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [chair, setChair] = useState(selectedChair || 'sillon_1_oro');
  const [time, setTime] = useState(selectedTime || '09:00');
  // const [treatmentType, setTreatmentType] = useState<'orthodontics' | 'general' | 'marketing'>('orthodontics');
  const [notes, setNotes] = useState('');

  const utils = trpc.useUtils();

  // Search patients
  const { data: patients, isLoading: searchingPatients } = trpc.patients.search.useQuery(
    { query: patientSearch },
    { enabled: patientSearch.length >= 2 }
  );

  // Create appointment mutation
  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success('Cita creada correctamente');
      utils.appointments.getByDate.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error al crear cita: ${error.message}`);
    },
  });

  const resetForm = () => {
    setPatientSearch('');
    setSelectedPatientId(null);
    setChair(selectedChair || 'sillon_1_oro');
    setTime(selectedTime || '09:00');
    setTreatmentType('orthodontics');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      toast.error('Por favor seleccione un paciente');
      return;
    }

    const [hours, minutes] = time.split(':');
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    await createAppointmentMutation.mutateAsync({
      patientId: selectedPatientId,
      appointmentDate: appointmentDate.toISOString(),
      treatmentType,
      chair,
      notes: notes || undefined,
    });
  };

  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 20) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar Nueva Cita</DialogTitle>
          <DialogDescription>
            Seleccione la fecha y hora del agendamiento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !appointmentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {appointmentDate ? format(appointmentDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={appointmentDate}
                  onSelect={(date) => date && setAppointmentDate(date)}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Patient Search */}
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente</Label>
            <Input
              id="patient"
              placeholder="Buscar por nombre, teléfono o CI..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            {searchingPatients && (
              <p className="text-sm text-muted-foreground">Buscando...</p>
            )}
            {patients && patients.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-accent ${
                      selectedPatientId === patient.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setPatientSearch(patient.name);
                    }}
                  >
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-muted-foreground">{patient.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Treatment Type */}
          <div className="space-y-2">
            <Label htmlFor="treatmentType">Tipo de Tratamiento</Label>
            <Select value={treatmentType} onValueChange={(value: any) => setTreatmentType(value)}>
              <SelectTrigger id="treatmentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orthodontics">Ortodoncia</SelectItem>
                <SelectItem value="general">Clínico General</SelectItem>
                <SelectItem value="marketing">Evaluación Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chair */}
          <div className="space-y-2">
            <Label htmlFor="chair">Cadeira</Label>
            <Select value={chair} onValueChange={setChair}>
              <SelectTrigger id="chair">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sillon_1_oro">Sillón 1 Oro</SelectItem>
                <SelectItem value="sillon_2_oro">Sillón 2 Oro</SelectItem>
                <SelectItem value="sillon_3_oro">Sillón 3 Oro</SelectItem>
                <SelectItem value="sillon_1_clinico">Sillón 1 Clínico</SelectItem>
                <SelectItem value="evaluacion_marketing">Evaluación Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Horario</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPatientId || createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Agendar Cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
