import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, User, MapPin, Phone, Clipboard, CheckCircle, Circle, X, AlertTriangle, UserX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Column definitions with modern colors
const COLUMNS = [
  { 
    id: "all", 
    title: "Agendados", 
    icon: Calendar,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300"
  },
  { 
    id: "pendientes", 
    title: "Pendientes", 
    icon: Clock,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    textColor: "text-amber-700 dark:text-amber-300"
  },
  { 
    id: "confirmadas", 
    title: "Confirmadas", 
    icon: CheckCircle,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-700 dark:text-green-300"
  },
  { 
    id: "completadas", 
    title: "Completadas", 
    icon: Circle,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    textColor: "text-purple-700 dark:text-purple-300"
  },
  { 
    id: "canceladas", 
    title: "Canceladas", 
    icon: X,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-300"
  },
  { 
    id: "reagendadas", 
    title: "Reagendadas", 
    icon: AlertTriangle,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    textColor: "text-orange-700 dark:text-orange-300"
  },
  { 
    id: "faltaram", 
    title: "Faltaram", 
    icon: UserX,
    color: "from-gray-500 to-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    textColor: "text-gray-700 dark:text-gray-300"
  },
];

// Status mapping
const STATUS_MAP: Record<string, string> = {
  marketing: "scheduled",
  pendientes: "scheduled",
  confirmadas: "confirmed",
  completadas: "completed",
  canceladas: "cancelled",
  reagendadas: "reagendamento_pendente",
  faltaram: "no_show",
};

const REVERSE_STATUS_MAP: Record<string, string> = {
  scheduled: "pendientes",
  confirmed: "confirmadas",
  completed: "completadas",
  cancelled: "canceladas",
  reagendamento_pendente: "reagendadas",
  no_show: "faltaram",
};

// Sortable card component
function SortableCard({ appointment }: { appointment: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get treatment type badge color
  const getTreatmentColor = (type: string) => {
    switch (type) {
      case "orthodontics":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "general_clinic":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getTreatmentLabel = (type: string) => {
    switch (type) {
      case "orthodontics":
        return "Ortodoncio";
      case "general_clinic":
        return "Clínico";
      default:
        return "Outro";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-card border border-border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
    >
      {/* Header with avatar and name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
          {appointment.patientName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">
            {appointment.patientName || "Sin nombre"}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTreatmentColor(appointment.appointmentType)}`}>
              {getTreatmentLabel(appointment.appointmentType)}
            </span>
          </div>
        </div>
      </div>

      {/* Appointment details */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {format(new Date(appointment.appointmentDate), "dd 'de' MMMM", { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {format(new Date(appointment.appointmentDate), "HH:mm")}
          </span>
        </div>
        {appointment.patientPhone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{appointment.patientPhone}</span>
          </div>
        )}
      </div>

      {/* Footer with sillón badge */}
      {appointment.chair && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs font-medium">
            <MapPin className="w-3 h-3" />
            Sillón {appointment.chair}
          </div>
        </div>
      )}
    </div>
  );
}

// Column component
function KanbanColumn({ column, appointments, isLoading }: { column: typeof COLUMNS[0]; appointments: any[]; isLoading: boolean }) {
  const Icon = column.icon;
  const count = appointments.length;

  return (
    <div className="flex flex-col h-full min-w-[320px]">
      {/* Column header */}
      <div className={`${column.bgColor} ${column.borderColor} border-2 rounded-t-xl p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${column.color} flex items-center justify-center text-white shadow-sm`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className={`font-semibold ${column.textColor}`}>{column.title}</h3>
          </div>
          <div className={`${column.textColor} text-sm font-bold bg-white dark:bg-gray-900 px-2.5 py-1 rounded-full`}>
            {count}
          </div>
        </div>
      </div>

      {/* Column content */}
      <div className={`flex-1 ${column.bgColor} ${column.borderColor} border-x-2 border-b-2 rounded-b-xl p-4 overflow-y-auto min-h-[500px]`}>
        <SortableContext items={appointments.map(apt => apt.id)} strategy={verticalListSortingStrategy}>
          {isLoading ? (
            <>
              <Skeleton className="h-32 mb-3" />
              <Skeleton className="h-32 mb-3" />
              <Skeleton className="h-32 mb-3" />
            </>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Icon className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Sin citas</p>
            </div>
          ) : (
            appointments.map((apt) => <SortableCard key={apt.id} appointment={apt} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanModerno() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedDate] = useState<Date>(new Date());

  // Load appointments
  const utils = trpc.useUtils();
  const { data: appointments, isLoading } = trpc.appointments.listByDate.useQuery({
    date: selectedDate.toISOString().split('T')[0],
  });

  // Update appointment mutation
  const updateAppointment = trpc.appointments.update.useMutation({
    onSuccess: () => {
      utils.appointments.listByDate.invalidate();
      toast.success("Cita actualizada con éxito");
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group appointments by column
  const groupedAppointments = COLUMNS.reduce((acc, column) => {
    if (column.id === 'all') {
      // Agendados column shows ALL appointments
      acc[column.id] = appointments || [];
    } else {
      const status = STATUS_MAP[column.id];
      acc[column.id] = appointments?.filter(
        (apt) => apt.status === status
      ) || [];
    }
    return acc;
  }, {} as Record<string, any[]>);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = active.id as number;
    const newColumnId = over.id as string;
    const newStatus = STATUS_MAP[newColumnId];

    if (!newStatus) return;

    // Find the appointment
    const appointment = appointments?.find((apt) => apt.id === appointmentId);
    if (!appointment) return;

    // Check if status actually changed
    const currentColumn = REVERSE_STATUS_MAP[appointment.status];
    if (currentColumn === newColumnId) return;

    // Update appointment
    updateAppointment.mutate({
      id: appointmentId,
      status: newStatus as any,
    });
  };

  // Get active appointment for drag overlay
  const activeAppointment = appointments?.find((apt) => apt.id === activeId);

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Kanban de Agendamentos
          </h1>
          <p className="text-muted-foreground mt-2">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        {/* Kanban board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 pb-6 min-w-min">
              {COLUMNS.map((column) => (
                <div key={column.id} id={column.id}>
                  <KanbanColumn
                    column={column}
                    appointments={groupedAppointments[column.id]}
                    isLoading={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeAppointment && (
              <div className="rotate-3 scale-105">
                <SortableCard appointment={activeAppointment} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </DashboardLayout>
  );
}
