import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { KanbanCard } from './KanbanCard';
import { Calendar, Clock, User, Phone } from 'lucide-react';

export type AppointmentEstado = 
  | 'marketing_evaluation'
  | 'ortho_scheduled_chair1'
  | 'ortho_scheduled_chair2'
  | 'ortho_scheduled_chair3'
  | 'ortho_confirmed'
  | 'ortho_not_confirmed'
  | 'general_confirmed'
  | 'general_not_confirmed_chair4'
  | 'confirmed'
  | 'not_confirmed'
  | 'cancelled'
  | 'scheduled';

export interface KanbanAppointment {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  appointmentDate: Date;
  treatmentType: string;
  status: AppointmentEstado;
  notes?: string;
}

interface KanbanBoardProps {
  appointments: KanbanAppointment[];
  onEstadoChange: (appointmentId: number, newEstado: AppointmentEstado) => Promise<void>;
}

const COLUMNS: { id: AppointmentEstado; title: string; color: string }[] = [
  { id: 'marketing_evaluation', title: 'Avaliações do Marketing', color: 'bg-purple-100 border-purple-300' },
  { id: 'ortho_scheduled_chair1', title: 'Ortodoncia Agendado - Sillón 1', color: 'bg-blue-100 border-blue-300' },
  { id: 'ortho_scheduled_chair2', title: 'Ortodoncia Agendado - Sillón 2', color: 'bg-blue-100 border-blue-300' },
  { id: 'ortho_scheduled_chair3', title: 'Ortodoncia Agendado - Sillón 3', color: 'bg-blue-100 border-blue-300' },
  { id: 'ortho_confirmed', title: 'Paciente Orto Confirmado', color: 'bg-green-100 border-green-300' },
  { id: 'ortho_not_confirmed', title: 'Paciente Orto Não Confirmado', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'general_confirmed', title: 'Clínico Geral Confirmado', color: 'bg-teal-100 border-teal-300' },
  { id: 'general_not_confirmed_chair4', title: 'Clínico Geral Não Confirmado - Sillón 4', color: 'bg-orange-100 border-orange-300' },
];

export function KanbanBoard({ appointments, onEstadoChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localAppointments, setLocalAppointments] = useState(appointments);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = active.id as number;
    const newEstado = over.id as AppointmentEstado;

    const appointment = localAppointments.find((a) => a.id === appointmentId);
    if (!appointment || appointment.status === newEstado) return;

    // Optimistic update
    const previousAppointments = [...localAppointments];
    setLocalAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newEstado } : a))
    );

    try {
      await onEstadoChange(appointmentId, newEstado);
    } catch (error) {
      // Rollback on error
      setLocalAppointments(previousAppointments);
      console.error('Failed to update appointment status:', error);
    }
  };

  const getAppointmentsByEstado = (status: AppointmentEstado) => {
    return localAppointments.filter((a) => a.status === status);
  };

  const activeAppointment = localAppointments.find((a) => a.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {COLUMNS.map((column) => {
          const columnAppointments = getAppointmentsByEstado(column.id);
          
          return (
            <SortableContext
              key={column.id}
              id={column.id}
              items={columnAppointments.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <Card className={`${column.color} border-2`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{column.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {columnAppointments.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[400px]">
                  {columnAppointments.map((appointment) => (
                    <KanbanCard key={appointment.id} appointment={appointment} />
                  ))}
                  {columnAppointments.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No hay citas en esta columna
                    </div>
                  )}
                </CardContent>
              </Card>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeAppointment && (
          <div className="opacity-90 rotate-3 cursor-grabbing">
            <Card className="bg-white shadow-2xl border-2 border-primary">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <User className="h-4 w-4" />
                    {activeAppointment.patientName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {activeAppointment.patientPhone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(activeAppointment.appointmentDate).toLocaleDateString('es-PY')}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3" />
                    {new Date(activeAppointment.appointmentDate).toLocaleTimeString('es-PY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <Badge variant="outline">{activeAppointment.treatmentType}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
