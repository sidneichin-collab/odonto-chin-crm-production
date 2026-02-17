import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

export default function KanbanPorDepartamento() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Query appointments for selected date
  const { data: appointments = [], isLoading } = trpc.appointments.listByDate.useQuery({
    date: selectedDate.toISOString().split("T")[0],
  });

  // Group appointments by department and status
  const groupedAppointments = {
    orto: {
      agendados: appointments.filter((a: any) => a.treatmentType === "orto" && a.status === "scheduled"),
      confirmados: appointments.filter((a: any) => a.treatmentType === "orto" && a.status === "confirmed"),
      pendientes: appointments.filter((a: any) => a.treatmentType === "orto" && a.status === "pending"),
    },
    clinico: {
      agendados: appointments.filter((a: any) => a.treatmentType === "clinico" && a.status === "scheduled"),
      confirmados: appointments.filter((a: any) => a.treatmentType === "clinico" && a.status === "confirmed"),
      pendientes: appointments.filter((a: any) => a.treatmentType === "clinico" && a.status === "pending"),
    },
    marketing: {
      agendados: appointments.filter((a: any) => a.treatmentType === "marketing" && a.status === "scheduled"),
      confirmados: appointments.filter((a: any) => a.treatmentType === "marketing" && a.status === "confirmed"),
      pendientes: appointments.filter((a: any) => a.treatmentType === "marketing" && a.status === "pending"),
    },
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kanban por Departamento</h1>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Navigation */}
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Calendar Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "d MMM yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* ORTO - 3 columns */}
          <KanbanColumn
            title="Agendados Orto"
            appointments={groupedAppointments.orto.agendados}
            color="green"
          />
          <KanbanColumn
            title="Confirmados Orto"
            appointments={groupedAppointments.orto.confirmados}
            color="green"
          />
          <KanbanColumn
            title="Pendientes Orto"
            appointments={groupedAppointments.orto.pendientes}
            color="green"
          />

          {/* CLÍNICO - 3 columns */}
          <KanbanColumn
            title="Agendados Clínico"
            appointments={groupedAppointments.clinico.agendados}
            color="blue"
          />
          <KanbanColumn
            title="Confirmados Clínico"
            appointments={groupedAppointments.clinico.confirmados}
            color="blue"
          />
          <KanbanColumn
            title="Pendientes Clínico"
            appointments={groupedAppointments.clinico.pendientes}
            color="blue"
          />

          {/* MARKETING - 3 columns */}
          <KanbanColumn
            title="Agendados Marketing"
            appointments={groupedAppointments.marketing.agendados}
            color="purple"
          />
          <KanbanColumn
            title="Confirmados Marketing"
            appointments={groupedAppointments.marketing.confirmados}
            color="purple"
          />
          <KanbanColumn
            title="Pendientes Marketing"
            appointments={groupedAppointments.marketing.pendientes}
            color="purple"
          />
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}

interface KanbanColumnProps {
  title: string;
  appointments: any[];
  color: "green" | "blue" | "purple";
}

function KanbanColumn({ title, appointments, color }: KanbanColumnProps) {
  const colorClasses = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
  };

  const headerColorClasses = {
    green: "bg-green-500 text-white",
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
  };

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">
      {/* Column Header */}
      <div className={`${headerColorClasses[color]} px-4 py-3 rounded-t-lg font-semibold text-center`}>
        {title}
        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
          {appointments.length}
        </span>
      </div>

      {/* Column Content */}
      <Card className={`${colorClasses[color]} border-t-0 rounded-t-none min-h-[400px] p-2 space-y-2`}>
        {appointments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Sin citas</p>
        ) : (
          appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} color={color} />
          ))
        )}
      </Card>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: any;
  color: "green" | "blue" | "purple";
}

function AppointmentCard({ appointment, color }: AppointmentCardProps) {
  const cardColorClasses = {
    green: "bg-green-100 border-green-300 hover:bg-green-200",
    blue: "bg-blue-100 border-blue-300 hover:bg-blue-200",
    purple: "bg-purple-100 border-purple-300 hover:bg-purple-200",
  };

  return (
    <Card className={`${cardColorClasses[color]} p-3 cursor-pointer transition-colors border`}>
      <div className="space-y-1">
        <p className="font-semibold text-sm">{appointment.patientName}</p>
        <p className="text-xs text-muted-foreground">
          {appointment.appointmentTime} - {appointment.treatmentType}
        </p>
        {appointment.notes && (
          <p className="text-xs text-muted-foreground truncate">{appointment.notes}</p>
        )}
      </div>
    </Card>
  );
}
