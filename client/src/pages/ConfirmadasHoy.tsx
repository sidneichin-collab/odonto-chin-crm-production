import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function ConfirmadasHoy() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Query para buscar consultas de hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: appointments, isLoading } = trpc.appointments.byDateRange.useQuery({
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString(),
  });

  const filteredAppointments = appointments?.filter((apt: any) =>
    apt.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.patient?.phone.includes(searchTerm) ||
    apt.patient?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Confirmadas Hoy</h1>
            <p className="text-gray-400">Pacientes que confirmaron presencia para hoy</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            Volver al Dashboard
          </Button>
        </div>

        {/* Busca */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800 text-white"
          />
        </div>

        {/* Tabela */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-4 text-gray-300 font-semibold">Nombre</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Contacto</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Documento</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Estado</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-400">
                    No hay citas confirmadas para hoy
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt: any) => (
                  <tr key={apt.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(apt.patient.name)} flex items-center justify-center text-white font-semibold`}>
                          {getInitials(apt.patient.name)}
                        </div>
                        <span className="text-white font-medium">{apt.patient.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📞</span>
                          <span>{apt.patient.phone}</span>
                        </div>
                        {apt.patient.email && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">✉️</span>
                            <span className="text-sm text-gray-400">{apt.patient.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {apt.patient.documentNumber || "-"}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400">
                        Activo
                      </span>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/pacientes/${apt.patient.id}`)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-gray-800"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
