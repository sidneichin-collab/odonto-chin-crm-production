import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, MessageCircle, Search, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";

interface PatientListModalProps {
  open: boolean;
  onClose: () => void;
  status: "sent" | "pending" | "failed" | "confirmed";
  onPatientSelect: (patient: any) => void;
}

const statusConfig = {
  sent: {
    title: "Recordatorios Enviados",
    description: "Pacientes que recibieron recordatorios en los últimos 7 días",
    color: "green" as const,
  },
  pending: {
    title: "Recordatorios Pendientes",
    description: "Pacientes con recordatorios programados para envío",
    color: "orange" as const,
  },
  failed: {
    title: "Recordatorios Fallados",
    description: "Pacientes cuyos recordatorios no pudieron ser enviados",
    color: "red" as const,
  },
  confirmed: {
    title: "Confirmaciones Recibidas",
    description: "Pacientes que confirmaron su cita en los últimos 7 días",
    color: "blue" as const,
  },
};

const statusColorMap = {
  green: "bg-green-100 text-green-800 border-green-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  red: "bg-red-100 text-red-800 border-red-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
};

export function PatientListModal({
  open,
  onClose,
  status,
  onPatientSelect,
}: PatientListModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch patients by status using the new procedure
  const { data: patients, isLoading } = trpc.reminders.getPatientsByStatus.useQuery(
    { status },
    { enabled: open }
  );

  const config = statusConfig[status];

  const filteredPatients = (patients || []).filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.phone?.includes(query) ||
      patient.email?.toLowerCase().includes(query)
    );
  });

  const handleViewDetails = (patientId: number) => {
    // TODO: Navigate to patient details page
    console.log("View patient details:", patientId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Patient List */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg ${statusColorMap[config.color]} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            📱 {patient.phone}
                          </p>
                          {patient.appointmentDate && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {new Date(patient.appointmentDate).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                                {patient.appointmentTime && ` - ${patient.appointmentTime}`}
                              </Badge>
                              {patient.chair && (
                                <Badge variant="secondary" className="text-xs">
                                  Sillón {patient.chair}
                                </Badge>
                              )}
                            </div>
                          )}
                          {patient.sentAt && (
                            <span className="text-xs text-muted-foreground block mt-1">
                              Enviado: {new Date(patient.sentAt).toLocaleString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {patient.confirmedAt && (
                            <span className="text-xs text-muted-foreground block mt-1">
                              Confirmado: {new Date(patient.confirmedAt).toLocaleString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewDetails(patient.id)}
                        title="Ver detalles del paciente"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onPatientSelect(patient)}
                        title="Enviar mensaje por WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No se encontraron pacientes</p>
                  <p className="text-sm mt-2">
                    {searchQuery
                      ? "Intenta con otro término de búsqueda"
                      : "No hay pacientes en esta categoría"}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer with Count */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredPatients.length} paciente{filteredPatients.length !== 1 ? "s" : ""}{" "}
            {searchQuery && `encontrado${filteredPatients.length !== 1 ? "s" : ""}`}
          </p>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
