import { Route, Switch } from "wouter";
import Home from "@/pages/Home";
import Pacientes from "@/pages/Pacientes";
import Agendamientos from "@/pages/Agendamientos";
import ListaEspera from "@/pages/ListaEspera";
import PacientesRiesgo from "@/pages/PacientesRiesgo";
import WhatsApp from "@/pages/WhatsApp";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen bg-black">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/pacientes" component={Pacientes} />
        <Route path="/agendamientos" component={Agendamientos} />
        <Route path="/lista-espera" component={ListaEspera} />
        <Route path="/pacientes-riesgo" component={PacientesRiesgo} />
        <Route path="/whatsapp" component={WhatsApp} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}
