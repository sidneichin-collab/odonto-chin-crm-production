import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Calendar as CalendarIcon, Clock, CheckCircle, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function DashboardFinal() {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Use statsByDate query with selected date
  const { data: stats, isLoading, refetch } = trpc.dashboard.statsByDate.useQuery({
    date: selectedDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
  });

  // Refetch when selectedDate changes
  useEffect(() => {
    refetch();
  }, [selectedDate, refetch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const formatDate = (date: Date) => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    return `${days[date.getDay()]}, ${date.getDate().toString().padStart(2, '0')} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[tomorrow.getDay()]}, ${tomorrow.getDate().toString().padStart(2, '0')} de ${months[tomorrow.getMonth()]}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth.getMonth() &&
                        selectedDate.getFullYear() === currentMonth.getFullYear();
      
      days.push(
        <button
          key={day}
          onClick={() => {
            const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            setSelectedDate(newDate);
          }}
          className={`h-10 w-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors
            ${isToday ? 'bg-cyan-500 text-white hover:bg-cyan-600' : ''}
            ${isSelected && !isToday ? 'bg-yellow-500 text-white hover:bg-yellow-600' : ''}
            ${!isToday && !isSelected ? 'text-gray-300 hover:bg-gray-800' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const getMonthYear = () => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Calendar */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground">{formatDate(selectedDate)}</p>
          </div>
          
          {/* Calendar Widget */}
          <Card className="bg-gray-900 border-gray-800 w-80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previousMonth}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-white">{getMonthYear()}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                  <div key={i} className="h-8 w-10 flex items-center justify-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
              
              {/* Today button */}
              <Button
                onClick={goToToday}
                className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white text-sm"
              >
                Hoy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments - 4 Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Citas de Hoy */}
          <Card 
            className="bg-blue-500 border-blue-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Citas de Hoy</span>
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {stats?.citasTotal || 0}
              </div>
              <p className="text-blue-100 text-xs">Consultas agendadas para hoy</p>
              <p className="text-blue-200 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>

          {/* Confirmadas */}
          <Card 
            className="bg-green-500 border-green-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Confirmadas</span>
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {(stats?.ortodonciaConfirmadas || 0) + (stats?.clinicoConfirmadas || 0)}
              </div>
              <p className="text-green-100 text-xs">Pacientes confirmaron asistencia</p>
              <p className="text-green-200 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>

          {/* Pendientes */}
          <Card 
            className="bg-orange-500 border-orange-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Pendientes</span>
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {(stats?.ortodonciaPendientes || 0) + (stats?.clinicoPendientes || 0)}
              </div>
              <p className="text-orange-100 text-xs">Esperando confirmación</p>
              <p className="text-orange-200 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>

          {/* Completadas */}
          <Card 
            className="bg-purple-500 border-purple-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Completadas</span>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {stats?.completadas || 0}
              </div>
              <p className="text-purple-100 text-xs">Consultas finalizadas hoy</p>
              <p className="text-purple-200 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Citas de Mañana Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Citas de Mañana - {getTomorrowDate()}
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {/* Confirmadas Mañana */}
            <Card 
              className="bg-green-500 border-green-600 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation("/agendamientos")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-semibold">Confirmadas Mañana</span>
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="text-5xl font-bold text-white mb-2">
                  0
                </div>
                <p className="text-green-100 text-xs">Clic para ver pacientes</p>
              </CardContent>
            </Card>

            {/* Pendientes Mañana */}
            <Card 
              className="bg-orange-500 border-orange-600 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation("/agendamientos")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-semibold">Pendientes Mañana</span>
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="text-5xl font-bold text-white mb-2">
                  0
                </div>
                <p className="text-orange-100 text-xs">Clic para ver pacientes</p>
              </CardContent>
            </Card>

            {/* Canceladas Mañana */}
            <Card 
              className="bg-red-500 border-red-600 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation("/agendamientos")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-semibold">Canceladas Mañana</span>
                  <X className="h-5 w-5 text-white" />
                </div>
                <div className="text-5xl font-bold text-white mb-2">
                  0
                </div>
                <p className="text-red-100 text-xs">Clic para ver pacientes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Quick Appointment */}
      <button
        onClick={() => setLocation("/agendamientos")}
        className="fixed bottom-8 right-8 w-16 h-16 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
        aria-label="Agendamiento rápido"
      >
        <span className="text-4xl font-light leading-none">+</span>
        <span className="absolute right-20 bg-gray-900 text-white text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Agendamiento Rápido
        </span>
      </button>
    </DashboardLayout>
  );
}
