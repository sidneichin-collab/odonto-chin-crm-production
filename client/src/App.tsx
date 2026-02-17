import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import PatientDetails from "./pages/PatientDetails";
import Appointments from "./pages/Appointments";

import Communications from "./pages/Communications";
import Reports from "./pages/Reports";
import Secretaries from "./pages/Secretaries";
import Settings from "./pages/Settings";
import Import from "./pages/Import";
import Waitlist from "./pages/Waitlist";
import RiskPatients from "./pages/RiskPatients";
import ReminderEffectiveness from "./pages/ReminderEffectiveness";
import Integraciones from "./pages/Integraciones";
import TestWebhook from "./pages/TestWebhook";
import IncomingMessages from "./pages/IncomingMessages";
// Legacy WhatsApp files removed - using evolutionApiService.ts instead
import ChannelHealth from "./pages/ChannelHealth";
import MensagensRecebidas from "./pages/MensagensRecebidas";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUsers from "./pages/AdminUsers";
import EstadisticasPlantillas from "./pages/EstadisticasPlantillas";
import TestsAB from "./pages/TestsAB";
import EfectividadRecordatorios from "./pages/EfectividadRecordatorios";
import ReminderReports from "./pages/ReminderReports";
import RescheduleRequests from "./pages/RescheduleRequests";
import Conversas from "./pages/Conversas";
import Canais from "./pages/Canais";
import Canales from "./pages/Canales";
import MonitoreoRecordatorios from "./pages/MonitoreoRecordatorios";
import ConfigurarN8n from "./pages/ConfigurarN8n";
import IntegrationStatus from './pages/StatusIntegracao';
import Etiquetas from "./pages/Etiquetas";
import ChairTrends from "./pages/ChairTrends";
import NovaConsulta from "./pages/NovaConsulta";
// import ChairStatistics from "./pages/ChairStatistics"; // Desabilitado - router não implementado
import OccupancySettings from "./pages/OccupancySettings";
import OccupancyForecast from "./pages/OccupancyForecast";
import { KanbanView } from "./pages/KanbanView";
import { AgendaView } from "./pages/AgendaView";
import KanbanPorDepartamento from "./pages/KanbanPorDepartamento";
import { AgendamentosKanban } from "./pages/AgendamentosKanban";
import Kanban from "./pages/Kanban";
import KanbanModerno from "./pages/KanbanModerno";
import ConfirmacionPendiente from "./pages/ConfirmacionPendiente";
import Templates from "./pages/Templates";
import Configuracoes from "./pages/Configuracoes";
import MensajesRecibidos from "./pages/MensajesRecibidos";
import SolicitudesReagendamiento from "./pages/SolicitudesReagendamiento";
import SaludCanales from "./pages/SaludCanales";
import RelatorioInadimplencia from "./pages/RelatorioInadimplencia";
import InsightsIA from "./pages/InsightsIA";
// import ConectarWhatsApp from "./pages/ConectarWhatsApp"; // DELETED
import MetricasDashboard from "./pages/MetricasDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/patients">
        <ProtectedRoute>
          <Patients />
        </ProtectedRoute>
      </Route>
      <Route path="/patients/new">
        <ProtectedRoute>
          <NewPatient />
        </ProtectedRoute>
      </Route>
      <Route path="/patients/:id">
        <ProtectedRoute>
          <PatientDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/appointments">
        <ProtectedRoute>
          <Appointments />
        </ProtectedRoute>
      </Route>
      <Route path="/kanban">
        <ProtectedRoute>
          <KanbanView />
        </ProtectedRoute>
      </Route>
      <Route path="/agenda">
        <ProtectedRoute>
          <AgendaView />
        </ProtectedRoute>
      </Route>
      <Route path="/kanban-departamento">
        <ProtectedRoute>
          <KanbanPorDepartamento />
        </ProtectedRoute>
      </Route>
      <Route path="/kanban-moderno">
        <ProtectedRoute>
          <KanbanModerno />
        </ProtectedRoute>
      </Route>
      <Route path="/confirmacion-pendiente">
        {() => (
          <ProtectedRoute>
            <ConfirmacionPendiente />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/agendamentos-kanban">
        {() => (
          <ProtectedRoute>
            <AgendamentosKanban />
          </ProtectedRoute>
        )}
      </Route>
      {/* <Route path="/conectar-whatsapp"> DELETED
        {() => (
          <ProtectedRoute>
            <ConectarWhatsApp />
          </ProtectedRoute>
        )}
      </Route> */}
      <Route path="/dashboard-metricas">
        {() => (
          <ProtectedRoute>
            <MetricasDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/communications">
        <ProtectedRoute>
          <Communications />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/secretaries">
        <ProtectedRoute>
          <Secretaries />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/import">
        <ProtectedRoute>
          <Import />
        </ProtectedRoute>
      </Route>
      <Route path="/waitlist">
        <ProtectedRoute>
          <Waitlist />
        </ProtectedRoute>
      </Route>
      <Route path="/risk-patients">
        <ProtectedRoute>
          <RiskPatients />
        </ProtectedRoute>
      </Route>
      <Route path="/reminder-effectiveness">
        <ProtectedRoute>
          <ReminderEffectiveness />
        </ProtectedRoute>
      </Route>
      <Route path="/integraciones">
        <ProtectedRoute>
          <Integraciones />
        </ProtectedRoute>
      </Route>
      <Route path="/test-webhook">
        <ProtectedRoute>
          <TestWebhook />
        </ProtectedRoute>
      </Route>
      <Route path="/incoming-messages">
        <ProtectedRoute>
          <IncomingMessages />
        </ProtectedRoute>
      </Route>
      {/* Legacy WhatsApp routes removed - using MonitoreoRecordatorios instead */}
      <Route path="/channel-health">
        <ProtectedRoute>
          <ChannelHealth />
        </ProtectedRoute>
      </Route>
      <Route path="/canales">
        <ProtectedRoute>
          <Canales />
        </ProtectedRoute>
      </Route>
      <Route path="/monitoreo-recordatorios">
        <ProtectedRoute>
          <MonitoreoRecordatorios />
        </ProtectedRoute>
      </Route>
      <Route path="/mensagens-recebidas">
        <ProtectedRoute>
          <MensagensRecebidas />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requireAdmin>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/estadisticas-plantillas">
        <ProtectedRoute>
          <EstadisticasPlantillas />
        </ProtectedRoute>
      </Route>
      <Route path="/tests-ab">
        <ProtectedRoute>
          <TestsAB />
        </ProtectedRoute>
      </Route>
      <Route path="/efectividad-recordatorios">
        <ProtectedRoute>
          <EfectividadRecordatorios />
        </ProtectedRoute>
      </Route>
      <Route path="/reminder-reports">
        <ProtectedRoute>
          <ReminderReports />
        </ProtectedRoute>
      </Route>
      <Route path="/conversas">
        <ProtectedRoute>
          <Conversas />
        </ProtectedRoute>
      </Route>
      <Route path="/canais">
        <ProtectedRoute>
          <Canais />
        </ProtectedRoute>
      </Route>
      <Route path="/configurar-n8n">
        <ProtectedRoute>
          <ConfigurarN8n />
        </ProtectedRoute>
      </Route>
      <Route path="/status-integracao">
        <ProtectedRoute>
          <IntegrationStatus />
        </ProtectedRoute>
      </Route>
      <Route path="/etiquetas">
        <ProtectedRoute>
          <Etiquetas />
        </ProtectedRoute>
      </Route>
      <Route path="/reschedule-requests">
        <ProtectedRoute>
          <RescheduleRequests />
        </ProtectedRoute>
      </Route>
      <Route path="/nova-consulta">
        <ProtectedRoute>
          <NovaConsulta />
        </ProtectedRoute>
      </Route>
      <Route path="/templates">
        <ProtectedRoute>
          <Templates />
        </ProtectedRoute>
      </Route>
      <Route path="/configuracoes">
        <ProtectedRoute>
          <Configuracoes />
        </ProtectedRoute>
      </Route>
      <Route path="/mensajes-recibidos">
        <ProtectedRoute>
          <MensajesRecibidos />
        </ProtectedRoute>
      </Route>
      <Route path="/solicitudes-reagendamiento">
        <ProtectedRoute>
          <SolicitudesReagendamiento />
        </ProtectedRoute>
      </Route>
      <Route path="/salud-canales">
        <ProtectedRoute>
          <SaludCanales />
        </ProtectedRoute>
      </Route>
      <Route path="/relatorio-inadimplencia">
        <ProtectedRoute>
          <RelatorioInadimplencia />
        </ProtectedRoute>
      </Route>
      <Route path="/insights-ia">
        <ProtectedRoute>
          <InsightsIA />
        </ProtectedRoute>
      </Route>
      {/* <Route path="/conectar-whatsapp"> DELETED
        <ProtectedRoute>
          <ConectarWhatsApp />
        </ProtectedRoute>
      </Route> */}
      {/* <Route path="/chair-statistics">
        <ProtectedRoute>
          <ChairStatistics />
        </ProtectedRoute>
      </Route> */}
      <Route path="/occupancy-settings">
        <ProtectedRoute>
          <OccupancySettings />
        </ProtectedRoute>
      </Route>
      <Route path="/chair-trends">
        <ProtectedRoute>
          <ChairTrends />
        </ProtectedRoute>
      </Route>
      <Route path="/occupancy-forecast">
        <ProtectedRoute>
          <OccupancyForecast />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
