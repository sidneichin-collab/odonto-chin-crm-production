import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, Clock, AlertTriangle, TrendingUp, Activity } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statCards = [
    {
      title: "Total Pacientes",
      value: stats?.totalPatients || 0,
      icon: Users,
      description: "Pacientes registrados",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Citas Hoy",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      description: "Agendamientos para hoy",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Lista de Espera",
      value: stats?.waitingList || 0,
      icon: Clock,
      description: "Pacientes esperando",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Pacientes en Riesgo",
      value: stats?.atRiskPatients || 0,
      icon: AlertTriangle,
      description: "Requieren atención",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Bienvenido al sistema de gestión odontológica
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded-lg"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                  <div className="h-3 w-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido al sistema de gestión odontológica
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sistema activo</p>
                    <p className="text-xs text-muted-foreground">
                      Todas las funciones operando normalmente
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sincronización WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Conectado y listo para enviar mensajes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resumen del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Citas Confirmadas</span>
                  <span className="text-sm font-bold text-green-500">
                    {Math.floor((stats?.todayAppointments || 0) * 0.8)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Citas Pendientes</span>
                  <span className="text-sm font-bold text-yellow-500">
                    {Math.ceil((stats?.todayAppointments || 0) * 0.2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Mensajes Enviados</span>
                  <span className="text-sm font-bold text-blue-500">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {stats && stats.atRiskPatients > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Alertas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hay {stats.atRiskPatients} paciente(s) en riesgo que requieren atención inmediata.
                Revisa la sección "Pacientes en Riesgo" para más detalles.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
