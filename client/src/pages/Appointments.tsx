import { useState, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { FileUpload } from "@/components/FileUpload";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, subWeeks, addWeeks, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Phone,
  Clock,
  User,
  Check,
  X,
  Edit,
  MessageSquare,
  Paperclip,
} from "lucide-react";

type KanbanAppointment = {
  id: number;
  patientName: string | null;
  patientPhone?: string | null;
  appointmentDate: string | Date;
  appointmentType: "marketing_evaluation" | "orthodontic_treatment" | "general_clinic";
  chair?: string | null;
  status: "scheduled" | "confirmed" | "pending" | "completed" | "cancelled" | "no_show";
  notes: string | null;
  duration: number;
  reminderAttempts: number;
};

// Horários de 08:00 às 18:00, intervalos de 20min
const TIME_SLOTS = Array.from({ length: 31 }, (_, i) => {
  const hour = Math.floor(i * 20 / 60) + 8;
  const minute = (i * 20) % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function GridCell({
  columnId,
  timeSlot,
  appointments,
  color,
  onAppointmentClick,
}: {
  columnId: string;
  timeSlot: string;
  appointments: KanbanAppointment[];
  color: string;
  onAppointmentClick: (apt: KanbanAppointment) => void;
}) {
  return (
    <div
      id={`${columnId}-${timeSlot}`}
      className={`${color} border-r border-b border-gray-200 dark:border-gray-700 p-1 min-h-[60px] relative`}
    >
      <div className="space-y-1">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            onClick={() => onAppointmentClick(apt)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1 cursor-pointer hover:shadow-md transition-shadow text-[10px]"
          >
            <p className="font-semibold truncate">{apt.patientName || "Sem nome"}</p>
            <p className="text-gray-600 dark:text-gray-400 truncate">{apt.patientPhone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<KanbanAppointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    appointmentDate: "",
    appointmentTime: "",
    chair: "",
    duration: 60,
    notes: "",
  });

  const utils = trpc.useUtils();

  // Upload file mutation
  const uploadFileMutation = trpc.files.upload.useMutation();

  // Send reminders mutation
  const sendRemindersMutation = trpc.remindersTrigger.sendManual.useMutation({
    onSuccess: (result: any) => {
      setSendingReminders(false);
      toast.success(`✅ Lembretes enviados! Éxito: ${result.sent}, Falhas: ${result.failed}`);
      utils.appointments.listByDate.invalidate();
    },
    onError: (error: any) => {
      setSendingReminders(false);
      toast.error(`Error ao enviar lembretes: ${error.message}`);
    },
  });

  // Fetch clinic configuration
  const { data: clinicConfig } = trpc.settings.getClinicConfig.useQuery();

  // Fetch appointments for selected date
  const { data: appointments = [], isLoading } = trpc.appointments.listByDate.useQuery({
    date: format(selectedDate, "yyyy-MM-dd"),
  });

  // Update appointment mutation
  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      toast.success("Consulta atualizada com sucesso!");
      utils.appointments.listByDate.invalidate();
      setShowEditModal(false);
      setShowDetailsModal(false);
    },
    onError: (error: any) => {
      toast.error(`Error ao atualizar consulta: ${error.message}`);
    },
  });

  // Generate dynamic columns based on clinic configuration
  const columns = useMemo(() => {
    if (!clinicConfig) return [];

    const cols = [];

    // Orthodontic chairs
    for (let i = 1; i <= clinicConfig.orthodonticChairs; i++) {
      cols.push({
        id: `ortho-${i}-scheduled`,
        label: `Cadeira ${i} Orto - Agendado`,
        chair: `ortho_${i}`,
        type: "orthodontic_treatment" as const,
        status: "scheduled" as const,
        color: "bg-blue-50 dark:bg-blue-950/30",
        headerColor: "bg-blue-100 dark:bg-blue-900",
      });
      cols.push({
        id: `ortho-${i}-confirmed`,
        label: `Cadeira ${i} Orto - Confirmado`,
        chair: `ortho_${i}`,
        type: "orthodontic_treatment" as const,
        status: "confirmed" as const,
        color: "bg-green-50 dark:bg-green-950/30",
        headerColor: "bg-green-100 dark:bg-green-900",
      });
      cols.push({
        id: `ortho-${i}-cancelled`,
        label: `Cadeira ${i} Orto - Cancelado`,
        chair: `ortho_${i}`,
        type: "orthodontic_treatment" as const,
        status: "cancelled" as const,
        color: "bg-red-50 dark:bg-red-950/30",
        headerColor: "bg-red-100 dark:bg-red-900",
      });
    }

    // Marketing evaluation (allows multiple appointments at same time)
    cols.push({
      id: "marketing",
      label: "Evaluación Marketing",
      chair: "marketing",
      type: "marketing_evaluation" as const,
      status: "scheduled" as const,
      color: "bg-purple-50 dark:bg-purple-950/30",
      headerColor: "bg-purple-100 dark:bg-purple-900",
    });

    // Clinic chairs
    for (let i = 1; i <= clinicConfig.clinicChairs; i++) {
      cols.push({
        id: `clinic-${i}-scheduled`,
        label: `Cadeira ${i} Clínico - Agendado`,
        chair: `clinic_${i}`,
        type: "general_clinic" as const,
        status: "scheduled" as const,
        color: "bg-cyan-50 dark:bg-cyan-950/30",
        headerColor: "bg-cyan-100 dark:bg-cyan-900",
      });
      cols.push({
        id: `clinic-${i}-confirmed`,
        label: `Cadeira ${i} Clínico - Confirmado`,
        chair: `clinic_${i}`,
        type: "general_clinic" as const,
        status: "confirmed" as const,
        color: "bg-emerald-50 dark:bg-emerald-950/30",
        headerColor: "bg-emerald-100 dark:bg-emerald-900",
      });
      cols.push({
        id: `clinic-${i}-cancelled`,
        label: `Cadeira ${i} Clínico - Cancelado`,
        chair: `clinic_${i}`,
        type: "general_clinic" as const,
        status: "cancelled" as const,
        color: "bg-rose-50 dark:bg-rose-950/30",
        headerColor: "bg-rose-100 dark:bg-rose-900",
      });
    }

    return cols;
  }, [clinicConfig]);

  // Group appointments by column and time slot
  const appointmentsByColumn = useMemo(() => {
    const grouped: Record<string, Record<string, KanbanAppointment[]>> = {};

    columns.forEach((col) => {
      grouped[col.id] = {};
      TIME_SLOTS.forEach((slot) => {
        grouped[col.id][slot] = [];
      });
    });

    appointments.forEach((apt) => {
      const time = format(new Date(apt.appointmentDate), "HH:mm");
      const aptWithChair = apt as any;
      const matchingCol = columns.find(
        (col) =>
          col.type === apt.appointmentType &&
          col.chair === (aptWithChair.chair || null) &&
          col.status === apt.status
      );

      if (matchingCol && grouped[matchingCol.id][time]) {
        grouped[matchingCol.id][time].push({ ...apt, chair: aptWithChair.chair || null } as KanbanAppointment);
      }
    });

    return grouped;
  }, [appointments, columns]);

  // Calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), { weekStartsOn: 0 });
    const end = endOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleAppointmentClick = (apt: KanbanAppointment) => {
    setSelectedAppointment(apt);
    setShowDetailsModal(true);
  };

  const handleEditClick = () => {
    if (!selectedAppointment) return;
    
    const aptDate = new Date(selectedAppointment.appointmentDate);
    setEditForm({
      appointmentDate: format(aptDate, "yyyy-MM-dd"),
      appointmentTime: format(aptDate, "HH:mm"),
      chair: selectedAppointment.chair || "",
      duration: selectedAppointment.duration,
      notes: selectedAppointment.notes || "",
    });
    
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedAppointment) return;

    const [year, month, day] = editForm.appointmentDate.split("-").map(Number);
    const [hour, minute] = editForm.appointmentTime.split(":").map(Number);
    const appointmentDate = new Date(year, month - 1, day, hour, minute);

    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      appointmentDate: appointmentDate.toISOString(),
      chair: editForm.chair || undefined,
      duration: editForm.duration,
      notes: editForm.notes || undefined,
    });
  };

  const handleConfirm = () => {
    if (!selectedAppointment) return;
    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      status: "confirmed",
    });
  };

  const handleCancel = () => {
    if (!selectedAppointment) return;
    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      status: "cancelled",
    });
  };

  const handleWhatsApp = () => {
    if (!selectedAppointment?.patientPhone) {
      toast.error("Paciente sem telefone cadastrado");
      return;
    }
    const phone = selectedAppointment.patientPhone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleSendRemindersNow = () => {
    setShowUploadDialog(true);
  };

  const handleConfirmSendReminders = async () => {
    setSendingReminders(true);
    setShowUploadDialog(false);
    
    let mediaUrl: string | undefined;
    let mediaType: "image" | "document" | "video" | "audio" | undefined;
    let fileName: string | undefined;

    // Se houver arquivo, fazer upload para S3
    if (uploadedFile) {
      toast.info("📄 Fazendo upload do arquivo...");
      
      try {
        // Converter arquivo para base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });

        // Upload para S3
        const uploadResult = await uploadFileMutation.mutateAsync({
          fileName: uploadedFile.name,
          fileData,
          contentType: uploadedFile.type,
        });

        if (uploadResult.success && uploadResult.url) {
          mediaUrl = uploadResult.url;
          fileName = uploadedFile.name;
          
          // Determinar tipo de mídia
          if (uploadedFile.type.startsWith("image/")) mediaType = "image";
          else if (uploadedFile.type.startsWith("video/")) mediaType = "video";
          else if (uploadedFile.type.startsWith("audio/")) mediaType = "audio";
          else mediaType = "document";
          
          toast.success("✅ Arquivo enviado com sucesso!");
        } else {
          toast.error("Error ao fazer upload do arquivo: " + uploadResult.error);
          setSendingReminders(false);
          return;
        }
      } catch (error) {
        toast.error("Error ao processar arquivo");
        setSendingReminders(false);
        return;
      }
    }

    toast.info("📤 Enviando lembretes para pacientes não confirmados...");
    
    // Send reminders for appointments 1 day before (tomorrow)
    sendRemindersMutation.mutate({
      daysBeforeAppointment: 1,
      mediaUrl,
      mediaType,
      fileName,
    });
    
    // Limpar arquivo após envio
    setUploadedFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Content - Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold">Agendamientos</h1>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          <div className="inline-block min-w-full">
            <table className="border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 z-20 bg-background border-r border-b border-border p-2 text-xs font-semibold w-16">
                    Horário
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className={`${col.headerColor} border-r border-b border-border p-2 text-xs font-semibold min-w-[120px] max-w-[150px]`}
                    >
                      <div className="truncate">{col.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((timeSlot) => (
                  <tr key={timeSlot}>
                    <td className="sticky left-0 z-10 bg-background border-r border-b border-border p-2 text-xs font-medium text-center">
                      {timeSlot}
                    </td>
                    {columns.map((col) => (
                      <GridCell
                        key={`${col.id}-${timeSlot}`}
                        columnId={col.id}
                        timeSlot={timeSlot}
                        appointments={appointmentsByColumn[col.id]?.[timeSlot] || []}
                        color={col.color}
                        onAppointmentClick={handleAppointmentClick}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar - Calendar */}
      <div className="w-80 border-l border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border space-y-2">
          <Button className="w-full" onClick={() => setShowNewAppointmentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Consulta
          </Button>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={handleSendRemindersNow}
            disabled={sendingReminders}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {sendingReminders ? "Enviando..." : "Enviar Lembrete Agora"}
          </Button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
              <div key={i} className="font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isTodayDate = isToday(day);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-md text-sm transition-colors
                    ${!isCurrentMonth && "text-muted-foreground opacity-50"}
                    ${isSelected && "bg-primary text-primary-foreground"}
                    ${!isSelected && isTodayDate && "bg-accent"}
                    ${!isSelected && !isTodayDate && "hover:bg-accent"}
                  `}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        open={showNewAppointmentModal}
        onOpenChange={setShowNewAppointmentModal}
        defaultDate={selectedDate}
        onSuccess={() => utils.appointments.listByDate.invalidate()}
      />

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles da Consulta</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Paciente</Label>
                  <p className="text-sm">{selectedAppointment.patientName || "Sem nome"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Teléfono</Label>
                  <p className="text-sm">{selectedAppointment.patientPhone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Data e Horário</Label>
                  <p className="text-sm">
                    {format(new Date(selectedAppointment.appointmentDate), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Duração</Label>
                  <p className="text-sm">{selectedAppointment.duration} minutos</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Tipo</Label>
                  <p className="text-sm">
                    {selectedAppointment.appointmentType === "orthodontic_treatment"
                      ? "Ortodoncia"
                      : selectedAppointment.appointmentType === "general_clinic"
                      ? "Clínico Geral"
                      : "Evaluación Marketing"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Cadeira</Label>
                  <p className="text-sm">{selectedAppointment.chair || "Não definida"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Estado</Label>
                  <Badge
                    variant={
                      selectedAppointment.status === "confirmed"
                        ? "default"
                        : selectedAppointment.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedAppointment.status === "scheduled"
                      ? "Agendado"
                      : selectedAppointment.status === "confirmed"
                      ? "Confirmado"
                      : "Cancelado"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Tentativas de Lembrete</Label>
                  <p className="text-sm">{selectedAppointment.reminderAttempts}</p>
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-semibold">Observaciones</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={handleWhatsApp}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {selectedAppointment.status !== "confirmed" && (
                  <Button variant="default" onClick={handleConfirm}>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                )}
                {selectedAppointment.status !== "cancelled" && (
                  <Button variant="destructive" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Consulta</DialogTitle>
            <DialogDescription>Atualize as informações da consulta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={editForm.appointmentDate}
                onChange={(e) => setEditForm({ ...editForm, appointmentDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                type="time"
                value={editForm.appointmentTime}
                onChange={(e) => setEditForm({ ...editForm, appointmentTime: e.target.value })}
              />
            </div>
            <div>
              <Label>Cadeira</Label>
              <Select value={editForm.chair} onValueChange={(value) => setEditForm({ ...editForm, chair: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione a cadeira" />
                </SelectTrigger>
                <SelectContent>
                  {clinicConfig && (
                    <>
                      {Array.from({ length: clinicConfig.orthodonticChairs }, (_, i) => (
                        <SelectItem key={`ortho_${i + 1}`} value={`ortho_${i + 1}`}>
                          Cadeira {i + 1} Ortodoncia
                        </SelectItem>
                      ))}
                      <SelectItem value="marketing">Evaluación Marketing</SelectItem>
                      {Array.from({ length: clinicConfig.clinicChairs }, (_, i) => (
                        <SelectItem key={`clinic_${i + 1}`} value={`clinic_${i + 1}`}>
                          Cadeira {i + 1} Clínico
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                min={20}
                step={20}
              />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateAppointmentMutation.isPending}>
              {updateAppointmentMutation.isPending ? "Salvando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload de Arquivo */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Lembretes com Anexo (Opcional)</DialogTitle>
            <DialogDescription>
              Você pode anexar uma imagem, PDF, vídeo ou áudio para enviar junto com os lembretes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <FileUpload
              onFileSelect={setUploadedFile}
              currentFile={uploadedFile}
              maxSizeMB={16}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadedFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSendReminders}
              disabled={sendingReminders}
            >
              {uploadedFile ? (
                <>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Enviar com Anexo
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar sem Anexo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
