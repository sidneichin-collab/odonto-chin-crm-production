import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Pencil, User, Phone, GripVertical } from 'lucide-react';

interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  time: string; // Format: "HH:MM"
  chair: string;
  status: 'confirmed' | 'not_confirmed' | 'cancelled';
  notes?: string;
}

interface Chair {
  id: string;
  name: string;
  color: string;
  doctor: string;
}

interface AgendaKanbanProps {
  appointments: Appointment[];
  onAppointmentMove: (appointmentId: number, newTime: string, newChair: string) => Promise<void>;
  onDoctorUpdate: (chairId: string, doctorName: string) => Promise<void>;
}

const TIME_SLOTS = [
  '08:00', '08:20', '08:40',
  '09:00', '09:20', '09:40',
  '10:00', '10:20', '10:40',
  '11:00', '11:20', '11:40',
  '12:00', '12:20', '12:40',
  '13:00', '13:20', '13:40',
  '14:00', '14:20', '14:40',
  '15:00', '15:20', '15:40',
  '16:00', '16:20', '16:40',
  '17:00', '17:20', '17:40',
  '18:00',
];

const CHAIRS: Chair[] = [
  { id: 'sillon_1_oro', name: 'Sillón 1 Oro', color: 'bg-emerald-500', doctor: '' },
  { id: 'sillon_2_oro', name: 'Sillón 2 Oro', color: 'bg-blue-500', doctor: '' },
  { id: 'sillon_3_oro', name: 'Sillón 3 Oro', color: 'bg-purple-500', doctor: '' },
  { id: 'sillon_1_clinico', name: 'Sillón 1 Clínico', color: 'bg-red-500', doctor: '' },
  { id: 'evaluacion_marketing', name: 'Evaluación Marketing', color: 'bg-cyan-500', doctor: '' },
];

export function AgendaKanban({ appointments, onAppointmentMove, onDoctorUpdate }: AgendaKanbanProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [chairs, setChairs] = useState<Chair[]>(CHAIRS);
  const [editingChair, setEditingChair] = useState<string | null>(null);
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
    const [newTime, newChair] = (over.id as string).split('|');

    const appointment = localAppointments.find((a) => a.id === appointmentId);
    if (!appointment || (appointment.time === newTime && appointment.chair === newChair)) return;

    // Optimistic update
    const previousAppointments = [...localAppointments];
    setLocalAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId ? { ...a, time: newTime, chair: newChair } : a
      )
    );

    try {
      await onAppointmentMove(appointmentId, newTime, newChair);
    } catch (error) {
      setLocalAppointments(previousAppointments);
      console.error('Failed to move appointment:', error);
    }
  };

  const handleDoctorEdit = (chairId: string) => {
    setEditingChair(chairId);
  };

  const handleDoctorSave = async (chairId: string, doctorName: string) => {
    setChairs((prev) =>
      prev.map((c) => (c.id === chairId ? { ...c, doctor: doctorName } : c))
    );
    setEditingChair(null);
    await onDoctorUpdate(chairId, doctorName);
  };

  const getAppointmentForSlot = (time: string, chair: string) => {
    return localAppointments.find((a) => a.time === time && a.chair === chair);
  };

  const activeAppointment = localAppointments.find((a) => a.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-auto border border-border rounded-lg">
        {/* Header Row */}
        <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-0 sticky top-0 z-20 bg-background">
          <div className="border-b-2 border-r-2 border-black bg-gray-100 p-3 font-semibold text-center">
            Hora
          </div>
          {chairs.map((chair) => (
            <div
              key={chair.id}
              className={`border-b-2 border-r-2 border-black ${chair.color} text-white p-3`}
            >
              <div className="space-y-2">
                <div className="font-semibold text-center">{chair.name}</div>
                {editingChair === chair.id ? (
                  <Input
                    type="text"
                    defaultValue={chair.doctor}
                    placeholder="Nombre del Dr."
                    className="h-7 text-sm bg-white text-black"
                    autoFocus
                    onBlur={(e) => handleDoctorSave(chair.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDoctorSave(chair.id, e.currentTarget.value);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs opacity-90">
                      {chair.doctor || 'Sin asignar'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-white/20"
                      onClick={() => handleDoctorEdit(chair.id)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots Grid */}
        {TIME_SLOTS.map((time) => (
          <div key={time} className="grid grid-cols-[100px_repeat(5,1fr)] gap-0">
            <div className="border-b-2 border-r-2 border-black bg-gray-100 p-3 text-center font-medium">
              {time}
            </div>
            {chairs.map((chair) => {
              const appointment = getAppointmentForSlot(time, chair.id);
              const slotId = `${time}|${chair.id}`;

              return (
                <TimeSlot
                  key={slotId}
                  id={slotId}
                  appointment={appointment}
                />
              );
            })}
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeAppointment && (
          <Card className="p-3 bg-white shadow-2xl border-2 border-primary opacity-90 rotate-3 w-48">
            <div className="space-y-1">
              <div className="flex items-center gap-1 font-semibold text-sm">
                <User className="h-3 w-3" />
                {activeAppointment.patientName}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {activeAppointment.patientPhone}
              </div>
              <Badge variant="outline" className="text-xs">
                {activeAppointment.time}
              </Badge>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function TimeSlot({ id, appointment }: { id: string; appointment?: Appointment }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="border-b-2 border-r-2 border-black p-2 min-h-[80px] bg-white"
    >
      {appointment && <DraggableAppointment appointment={appointment} />}
    </div>
  );
}

function DraggableAppointment({ appointment }: { appointment: Appointment }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const statusColors = {
    confirmed: 'bg-green-100 border-green-400',
    not_confirmed: 'bg-yellow-100 border-yellow-400',
    cancelled: 'bg-red-100 border-red-400',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`p-2 cursor-grab active:cursor-grabbing ${statusColors[appointment.status]} border-2`}
      >
        <div className="flex items-start gap-1">
          <div {...listeners} className="cursor-grab active:cursor-grabbing mt-0.5">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <div className="font-semibold text-xs truncate">{appointment.patientName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {appointment.patientPhone}
            </div>
            {appointment.notes && (
              <div className="text-xs italic truncate text-muted-foreground">
                {appointment.notes}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
