import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardFinal from "./pages/DashboardFinal";
import Pacientes from "./pages/Pacientes";
import Agendamientos from "./pages/Agendamientos";
import ListaEspera from "./pages/ListaEspera";
import PacientesRiesgo from "./pages/PacientesRiesgo";
import WhatsApp from "./pages/WhatsApp";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={DashboardFinal} />
      <Route path={"/pacientes"} component={Pacientes} />
      <Route path={"/agendamientos"} component={Agendamientos} />
      <Route path={"/lista-espera"} component={ListaEspera} />
      <Route path={"/pacientes-riesgo"} component={PacientesRiesgo} />
      <Route path={"/whatsapp"} component={WhatsApp} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
