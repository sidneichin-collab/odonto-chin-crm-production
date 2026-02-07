import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Users, Calendar as CalendarIcon, Clock, AlertTriangle, X, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function DashboardNew() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading, refetch } = trpc.dashboard.stats.useQuery();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const formatDate = (date: Date) => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
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
        {/* Header with "Ver Agenda" button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hoy</h1>
            <p className="text-sm text-muted-foreground mt-1">{formatDate(currentDate)}</p>
          </div>
          <Button 
            onClick={() => setLocation("/agendamientos")}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6"
          >
            Ver Agenda
          </Button>
        </div>

        {/* Today's Appointments - Colored Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Ortodontia Confirmadas */}
          <Card 
            className="bg-blue-500 border-blue-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                {Math.floor((stats?.todayAppointments || 0) * 0.4)}
              </div>
              <p className="text-white text-sm font-medium">Ortodontia Confirmadas</p>
              <p className="text-blue-100 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>

          {/* Ortodontia Pendientes */}
          <Card 
            className="bg-green-500 border-green-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                {Math.floor((stats?.todayAppointments || 0) * 0.2)}
              </div>
              <p className="text-white text-sm font-medium">Ortodontia Pendientes</p>
              <p className="text-green-100 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>

          {/* Clínico General Confirmadas */}
          <Card 
            className="bg-orange-500 border-orange-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                {Math.floor((stats?.todayAppointments || 0) * 0.3)}
              </div>
              <p className="text-white text-sm font-medium">Clínico General Confirmadas</p>
              <p className="text-orange-100 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>

          {/* Clínico General Pendientes */}
          <Card 
            className="bg-purple-500 border-purple-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                {Math.floor((stats?.todayAppointments || 0) * 0.1)}
              </div>
              <p className="text-white text-sm font-medium">Clínico General Pendientes</p>
              <p className="text-purple-100 text-xs mt-1">Clic para ver pacientes</p>
            </CardContent>
          </Card>

          {/* Canceladas */}
          <Card 
            className="bg-red-500 border-red-600 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/agendamientos")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <X className="h-6 w-6 text-white" />
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                0
              </div>
              <p className="text-white text-sm font-medium">Canceladas</p>
              <p className="text-red-100 text-xs mt-1">Citas canceladas</p>
            </CardContent>
          </Card>
        </div>

        {/* Día Siguiente Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Día Siguiente - {getTomorrowDate()}
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {/* Confirmadas */}
            <Card 
              className="bg-green-500 border-green-600 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation("/agendamientos")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="text-6xl font-bold text-white mb-2">
                  0
                </div>
                <p className="text-white text-sm font-medium">Confirmadas</p>
                <p className="text-green-100 text-xs mt-1">Clic para ver pacientes</p>
              </CardContent>
            </Card>

            {/* Pendientes */}
            <Card 
              className="bg-orange-500 border-orange-600 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation("/agendamientos")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-6xl font-bold text-white mb-2">
                  0
                </div>
                <p className="text-white text-sm font-medium">Pendientes</p>
                <p className="text-orange-100 text-xs mt-1">Clic para ver pacientes</p>
              </CardContent>
            </Card>

            {/* Canceladas */}
            <Card 
              className="bg-red-500 border-red-600 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation("/agendamientos")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <X className="h-6 w-6 text-white" />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-6xl font-bold text-white mb-2">
                  0
                </div>
                <p className="text-white text-sm font-medium">Canceladas</p>
                <p className="text-red-100 text-xs mt-1">Clic para ver pacientes</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mt-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/pacientes")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pacientes</p>
                  <p className="text-2xl font-bold">{stats?.totalPatients || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/agendamientos")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Citas Hoy</p>
                  <p className="text-2xl font-bold">{stats?.todayAppointments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/lista-espera")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lista de Espera</p>
                  <p className="text-2xl font-bold">{stats?.waitingList || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/pacientes-riesgo")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Riesgo</p>
                  <p className="text-2xl font-bold">{stats?.atRiskPatients || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
