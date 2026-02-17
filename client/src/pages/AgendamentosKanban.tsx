import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { ChatwootSidebar } from "@/components/ChatwootSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Column definitions
const COLUMNS = [
  {
    id: "all",
    title: "Agendados",
    icon: CalendarIcon,
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  {
    id: "sillon_orto_1",
    title: "Sillón 1 Oro",
    icon: CalendarIcon,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "sillon_orto_2",
    title: "Sillón 2 Oro",
    icon: CalendarIcon,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "sillon_orto_3",
    title: "Sillón 3 Oro",
    icon: CalendarIcon,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    id: "sillon_clinico",
    title: "Sillón 1 Clínico",
    icon: CalendarIcon,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
  {
    id: "evaluacion_marketing",
    title: "Evaluación Marketing",
    icon: CalendarIcon,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
];

export function AgendamentosKanban() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [treatmentFilter, setTreatmentFilter] = useState<"all" | "orthodontics" | "general_clinic">("all");
  const [activeId, setActiveId] = useState<number | null>(null);

  // Fetch appointments for selected date
  const { data: appointments, isLoading } = trpc.appointments.listByDate.useQuery({
    date: format(selectedDate, "yyyy-MM-dd"),
  });

  // Fetch stats for sidebar
  // TODO: Implement getStats procedure in server/routers.ts
  // const { data: stats } = trpc.appointments.getStats.useQuery({
  //   date: format(selectedDate, "yyyy-MM-dd"),
  // });

  // Group appointments by sillon
  const groupedAppointments = appointments?.reduce((acc, apt) => {
    // Add to "all" (Agendados)
    if (!acc.all) acc.all = [];
    acc.all.push(apt);

    // Add to specific sillon
    const sillonKey = apt.chair || "sin_sillon";
    if (!acc[sillonKey]) acc[sillonKey] = [];
    acc[sillonKey].push(apt);

    return acc;
  }, {} as Record<string, typeof appointments>) || {};

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    // TODO: Implement drag & drop logic to change sillon
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Agendamentos Kanban</h1>
            <p className="text-muted-foreground mt-1">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <Button 
            className="bg-cyan-500 hover:bg-cyan-600"
            onClick={() => {/* TODO: Open modal */}}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>

        {/* Main content: Sidebar + Kanban */}
        <div className="flex gap-0 flex-1 overflow-hidden">
          {/* Chatwoot Sidebar */}
          <ChatwootSidebar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            treatmentFilter={treatmentFilter}
            onFilterChange={setTreatmentFilter}
            stats={undefined}
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
                                draggable={column.id !== "all"} // Only draggable in sillon columns
                                onDragStart={() => column.id !== "all" && setActiveId(apt.id)}
                                className={`bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${column.id !== "all" ? "cursor-move" : "cursor-default"}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-sm">{apt.patientName}</h4>
                                  {getTreatmentBadge(apt.appointmentType)}
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p>📞 {apt.patientPhone}</p>
                                  <p>🕐 {format(new Date(apt.appointmentDate), "HH:mm", { locale: es })}</p>
                                  {column.id !== "all" && <p>🪑 {apt.chair}</p>}
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
            </DndContext>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
