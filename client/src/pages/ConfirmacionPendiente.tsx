/**
 * Confirmación/Pendiente Kanban - Status Board
 * 6 columns: Pendientes, Confirmadas, Completadas, Canceladas, Reagendadas, Faltaram
 * Chatwoot-style sidebar with filters, calendar, and stats
 */

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ChatwootSidebar } from "@/components/ChatwootSidebar";
import { trpc } from "@/lib/trpc";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Clock, CheckCircle, CheckCheck, XCircle, RefreshCw, UserX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Column definitions
const COLUMNS = [
  { 
    id: "all", 
    title: "Agendados", 
    icon: Clock,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  { 
    id: "scheduled", 
    title: "Pendientes", 
    icon: Clock,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  { 
    id: "confirmed", 
    title: "Confirmadas", 
    icon: CheckCircle,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  { 
    id: "completed", 
    title: "Completadas", 
    icon: CheckCheck,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  { 
    id: "cancelled", 
    title: "Canceladas", 
    icon: XCircle,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
  { 
    id: "rescheduled", 
    title: "Reagendadas", 
    icon: RefreshCw,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  { 
    id: "no_show", 
    title: "Faltaram", 
    icon: UserX,
    color: "from-gray-500 to-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
];

export default function ConfirmacionPendiente() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'orthodontics' | 'general_clinic'>('all');
  const [activeId, setActiveId] = useState<number | null>(null);

  // Load appointments
  const utils = trpc.useUtils();
  const { data: appointments, isLoading } = trpc.appointments.listByDate.useQuery({
    date: selectedDate.toISOString().split('T')[0],
  });

  // Update appointment status mutation
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status actualizado");
      utils.appointments.listByDate.invalidate();
    },
    onError: () => {
      toast.error("Error al actualizar status");
    },
  });

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (treatmentFilter === 'all') return appointments;
    return appointments.filter(apt => apt.appointmentType === treatmentFilter);
  }, [appointments, treatmentFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!appointments) return { total: 0, orthodontics: 0, clinic: 0 };
    return {
      total: appointments.length,
      orthodontics: appointments.filter(a => a.appointmentType === 'orthodontics').length,
      clinic: appointments.filter(a => a.appointmentType === 'general_clinic').length,
    };
  }, [appointments]);

  // Group by status
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, any[]> = {};
    COLUMNS.forEach(col => {
      if (col.id === 'all') {
        // Agendados column shows ALL appointments of the day
        groups[col.id] = filteredAppointments;
      } else {
        // Other columns show only appointments with that specific status
        groups[col.id] = filteredAppointments.filter(apt => apt.status === col.id);
      }
    });
    return groups;
  }, [filteredAppointments]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const appointmentId = active.id as number;
    const newStatus = over.id as "pending" | "scheduled" | "confirmed";

    // Update status
    updateStatus.mutate({ id: appointmentId, status: newStatus });
    setActiveId(null);
  };

  const getTreatmentBadge = (type: string) => {
    if (type === 'orthodontics') {
      return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">🦷 Ortodoncio</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">🏥 Clínico</span>;
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold">Confirmación / Pendiente</h1>
          <p className="text-muted-foreground mt-1">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        {/* Main content: Sidebar + Kanban */}
        <div className="flex gap-0 flex-1 overflow-hidden">
          {/* Chatwoot Sidebar */}
          <ChatwootSidebar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            treatmentFilter={treatmentFilter}
            onFilterChange={setTreatmentFilter}
            stats={stats}
          />

          {/* Kanban Board */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            <DndContext
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 h-full min-w-max">
                {COLUMNS.map((column) => {
                  const Icon = column.icon;
                  const columnAppointments = groupedAppointments[column.id] || [];

                  return (
                    <div
                      key={column.id}
                      className={`flex flex-col w-80 rounded-lg border ${column.borderColor} ${column.bgColor} overflow-hidden`}
                    >
                      {/* Column Header */}
                      <div className={`p-4 bg-gradient-to-r ${column.color} text-white`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <h3 className="font-semibold">{column.title}</h3>
                          </div>
                          <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
                            {columnAppointments.length}
                          </span>
                        </div>
                      </div>

                      {/* Column Content */}
                      <SortableContext
                        id={column.id}
                        items={columnAppointments.map(apt => apt.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                          {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-32 w-full" />
                            ))
                          ) : columnAppointments.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-8">
                              Sin citas
                            </div>
                          ) : (
                            columnAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                draggable
                                onDragStart={() => setActiveId(apt.id)}
                                className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-sm">{apt.patientName}</h4>
                                  {getTreatmentBadge(apt.appointmentType)}
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p>📞 {apt.patientPhone}</p>
                                  <p>🕐 {format(new Date(apt.appointmentDate), "HH:mm", { locale: es })}</p>
                                  <p>🪑 {apt.chair}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeId ? (
                  <div className="bg-card border-2 border-primary rounded-lg p-4 shadow-lg opacity-90">
                    Moviendo...
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
