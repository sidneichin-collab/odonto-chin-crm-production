import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Clock, User, Phone, Mail, Facebook, Instagram, Sparkles } from "lucide-react";

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultDate?: Date;
}

export function NewAppointmentModal({ open, onOpenChange, onSuccess, defaultDate }: NewAppointmentModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; phone: string; email: string | null } | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  
  // Form state
  const [patientName, setPatientName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [cedulaImage, setCedulaImage] = useState<File | null>(null);
  const [patientFacebook, setPatientFacebook] = useState("");
  const [patientInstagram, setPatientInstagram] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(defaultDate ? defaultDate.toISOString().split('T')[0] : "");
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [appointmentType, setAppointmentType] = useState<"marketing_evaluation" | "orthodontic_treatment" | "general_clinic">("orthodontic_treatment");
  const [chair, setChair] = useState("");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");

  // Fetch clinic configuration
  const { data: clinicConfig } = trpc.settings.getClinicConfig.useQuery();

  // Fetch best time slots for recommendations
  const { data: bestSlots } = trpc.occupancyForecast.getBestTimeSlots.useQuery(
    { daysAhead: 7 },
    { enabled: !!appointmentDate }
  );

  // Check if current selection is recommended
  const isRecommended = bestSlots?.some(
    slot => slot.date === appointmentDate && 
            slot.hour === parseInt(appointmentTime.split(':')[0]) && 
            slot.chair === chair
  );

  const utils = trpc.useUtils();
  const searchPatients = trpc.patients.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 && !selectedPatient && !showNewPatientForm }
  );

  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Consulta agendada com sucesso!");
      utils.appointments.listByDate.invalidate();
      utils.appointments.listByDateRange.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Error ao agendar consulta: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSearchQuery("");
    setSelectedPatient(null);
    setShowNewPatientForm(false);
    setPatientName("");
    setPatientLastName("");
    setPatientPhone("");
    setEmergencyPhone("");
    setPatientEmail("");
    setUbicacion("");
    setCedulaImage(null);
    setPatientFacebook("");
    setPatientInstagram("");
    setAppointmentDate(defaultDate ? defaultDate.toISOString().split('T')[0] : "");
    setAppointmentTime("09:00");
    setAppointmentType("orthodontic_treatment");
    setChair("");
    setDuration(60);
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient && !showNewPatientForm) {
      toast.error("Seleccione um paciente ou crie um novo");
      return;
    }

    // Validate all mandatory fields for new patients
    if (showNewPatientForm) {
      if (!patientName || !patientLastName || !patientPhone || !emergencyPhone || !ubicacion || !cedulaImage) {
        toast.error("Complete todos os campos obrigatórios: nome, apellido, teléfono, teléfono emergencia, ubicación, imagen cédula");
        return;
      }
    }

    if (!appointmentDate || !appointmentTime) {
      toast.error("Seleccione data e horário");
      return;
    }

    if (!chair) {
      toast.error("Seleccione uma cadeira");
      return;
    }

    const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

    // Check availability before creating
    try {
      const availability = await utils.client.appointments.checkAvailability.query({
        appointmentDate: appointmentDateTime,
        chair,
        appointmentType,
      });

      if (!availability.available) {
        if (appointmentType === "marketing_evaluation") {
          // Allow multiple marketing evaluations
          toast.info("⚠️ Já existe consulta neste horário, mas Evaluación Marketing permite múltiplas reservas");
        } else {
          const conflictCount = availability.conflictingAppointments?.length || 0;
          toast.error(`❌ Horário não disponível! ${conflictCount} consulta(s) já agendada(s) neste horário e cadeira.`);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      toast.error("Error ao verificar disponibilidade");
      return;
    }

    // Upload cedula image if creating new patient
    let cedulaImageUrl = "";
    if (showNewPatientForm && cedulaImage) {
      try {
        const formData = new FormData();
        formData.append('file', cedulaImage);
        
        const uploadResponse = await fetch('/api/upload-cedula', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Error al subir imagen de cédula');
        }
        
        const { url } = await uploadResponse.json();
        cedulaImageUrl = url;
      } catch (error) {
        toast.error('Error al subir imagen de cédula');
        return;
      }
    }

    const mutationInput: any = {
      patientName: showNewPatientForm ? patientName : selectedPatient!.name,
      patientPhone: showNewPatientForm ? patientPhone : selectedPatient!.phone,
      appointmentDateTime,
      appointmentType,
      chair: chair || undefined,
      duration,
      notes,
    };

    if (selectedPatient?.id) {
      mutationInput.patientId = selectedPatient.id;
    }

    if (showNewPatientForm) {
      mutationInput.patientLastName = patientLastName;
      mutationInput.emergencyPhone = emergencyPhone;
      mutationInput.ubicacion = ubicacion;
      mutationInput.cedulaImageUrl = cedulaImageUrl;
      if (patientEmail) mutationInput.patientEmail = patientEmail;
      if (patientFacebook) mutationInput.patientFacebook = patientFacebook;
      if (patientInstagram) mutationInput.patientInstagram = patientInstagram;
    }

    createAppointment.mutate(mutationInput);
  };

  // Generate time slots (08:00 - 18:00, 20min intervals)
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 20) {
      if (hour === 18 && minute > 0) break;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nueva Consulta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search/Selection */}
          <div className="space-y-4">
            <Label>Paciente</Label>
            
            {!selectedPatient && !showNewPatientForm && (
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente por nombre o teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchPatients.data && searchPatients.data.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {searchPatients.data.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setSearchQuery("");
                        }}
                        className="w-full p-3 text-left hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">{patient.phone}</div>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewPatientForm(true)}
                  className="w-full"
                >
                  + Crear Nuevo Paciente
                </Button>
              </div>
            )}

            {selectedPatient && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/50">
                <div>
                  <div className="font-medium">{selectedPatient.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedPatient.phone}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Cambiar
                </Button>
              </div>
            )}

            {showNewPatientForm && (
              <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Datos del Nuevo Paciente</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewPatientForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName">Nombre *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientName"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Juan"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="patientLastName">Apellido *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientLastName"
                        value={patientLastName}
                        onChange={(e) => setPatientLastName(e.target.value)}
                        placeholder="Pérez"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="patientPhone">Teléfono (WhatsApp) *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientPhone"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="+591 12345678"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Teléfono Emergencia *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="emergencyPhone"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+591 87654321"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="patientEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientEmail"
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="email@ejemplo.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ubicacion">Ubicación *</Label>
                    <div className="relative">
                      <Input
                        id="ubicacion"
                        value={ubicacion}
                        onChange={(e) => setUbicacion(e.target.value)}
                        placeholder="Asunción, Barrio Centro"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="cedulaImage">Imagen de Cédula *</Label>
                    <Input
                      id="cedulaImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setCedulaImage(file);
                      }}
                      className="cursor-pointer"
                      required
                    />
                    {cedulaImage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Archivo: {cedulaImage.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="patientFacebook">Facebook</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientFacebook"
                        value={patientFacebook}
                        onChange={(e) => setPatientFacebook(e.target.value)}
                        placeholder="Usuario o perfil"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="patientInstagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientInstagram"
                        value={patientInstagram}
                        onChange={(e) => setPatientInstagram(e.target.value)}
                        placeholder="@usuario"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Detalles de la Consulta</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointmentDate">Fecha *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="appointmentTime">Horario *</Label>
                <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointmentType">Tipo de Consulta *</Label>
                <Select value={appointmentType} onValueChange={(value: any) => setAppointmentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orthodontic_treatment">Ortodoncia</SelectItem>
                    <SelectItem value="general_clinic">Clínico Geral</SelectItem>
                    <SelectItem value="marketing_evaluation">Evaluación Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="chair">Cadeira</Label>
                  {isRecommended && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Horario Recomendado
                    </span>
                  )}
                </div>
                <Select value={chair} onValueChange={setChair}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cadeira" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentType === "orthodontic_treatment" && clinicConfig && Array.from({ length: clinicConfig.orthodonticChairs }, (_, i) => {
                      const chairName = `Cadeira ${i+1} Orto`;
                      const isSlotRecommended = bestSlots?.some(
                        slot => slot.date === appointmentDate && 
                                slot.hour === parseInt(appointmentTime.split(':')[0]) && 
                                slot.chair === chairName
                      );
                      return (
                        <SelectItem key={`orto-${i+1}`} value={chairName}>
                          <div className="flex items-center gap-2">
                            {chairName}
                            {isSlotRecommended && <Sparkles className="h-3 w-3 text-green-600" />}
                          </div>
                        </SelectItem>
                      );
                    })}
                    {appointmentType === "general_clinic" && clinicConfig && Array.from({ length: clinicConfig.clinicChairs }, (_, i) => {
                      const chairName = `Cadeira ${i+1} Clínico`;
                      const isSlotRecommended = bestSlots?.some(
                        slot => slot.date === appointmentDate && 
                                slot.hour === parseInt(appointmentTime.split(':')[0]) && 
                                slot.chair === chairName
                      );
                      return (
                        <SelectItem key={`clinico-${i+1}`} value={chairName}>
                          <div className="flex items-center gap-2">
                            {chairName}
                            {isSlotRecommended && <Sparkles className="h-3 w-3 text-green-600" />}
                          </div>
                        </SelectItem>
                      );
                    })}
                    {appointmentType === "marketing_evaluation" && (
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 minutos</SelectItem>
                    <SelectItem value="40">40 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="80">80 minutos</SelectItem>
                    <SelectItem value="100">100 minutos</SelectItem>
                    <SelectItem value="120">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre la consulta..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAppointment.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createAppointment.isPending}
              className="bg-primary"
            >
              {createAppointment.isPending ? "Agendando..." : "Agendar Consulta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
