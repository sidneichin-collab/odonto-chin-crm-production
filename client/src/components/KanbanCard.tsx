import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, User, Phone, GripVertical } from 'lucide-react';
import { KanbanAppointment } from './KanbanBoard';

interface KanbanCardProps {
  appointment: KanbanAppointment;
}

export function KanbanCard({ appointment }: KanbanCardProps) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="bg-white hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div {...listeners} className="mt-1 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" />
                {appointment.patientName}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {appointment.patientPhone}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                {new Date(appointment.appointmentDate).toLocaleDateString('es-PY')}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3" />
                {new Date(appointment.appointmentDate).toLocaleTimeString('es-PY', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <Badge variant="outline" className="text-xs">
                {appointment.treatmentType}
              </Badge>
              {appointment.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {appointment.notes}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
