import { useState } from "react";
import { Plus, MessageCircle, MessageSquare, Link2, MessageCircleMore, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

interface Campaign {
  id: number;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  country: string;
  leads: number;
  sent: number;
  responses: number;
  date: string;
}

interface Channel {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: number;
  total?: number;
  color: string;
  borderColor: string;
  buttonColor: string;
}

export default function Campanhas() {
  const [campaigns] = useState<Campaign[]>([
    { id: 1, name: "Execution Test", status: "draft", country: "All", leads: 0, sent: 0, responses: 0, date: "18/01/2026" },
    { id: 2, name: "Test Campaign", status: "draft", country: "All", leads: 0, sent: 0, responses: 0, date: "18/01/2026" },
    { id: 3, name: "Video Campaign", status: "draft", country: "All", leads: 0, sent: 0, responses: 0, date: "18/01/2026" },
    { id: 4, name: "Test Wizard Campaign", status: "draft", country: "All", leads: 0, sent: 0, responses: 0, date: "18/01/2026" },
    { id: 5, name: "Image Campaign", status: "draft", country: "All", leads: 0, sent: 0, responses: 0, date: "18/01/2026" },
    { id: 6, name: "Test Campaign", status: "active", country: "All", leads: 0, sent: 0, responses: 0, date: "18/01/2026" },
  ]);

  const channels: Channel[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <MessageCircle className="w-8 h-8" />,
      connected: 0,
      total: 5,
      color: "bg-green-500",
      borderColor: "border-green-500",
      buttonColor: "bg-green-500 hover:bg-green-600",
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: <MessageSquare className="w-8 h-8" />,
      connected: 0,
      color: "bg-blue-500",
      borderColor: "border-blue-500",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: "n8n",
      name: "n8n",
      icon: <Link2 className="w-8 h-8" />,
      connected: 0,
      color: "bg-purple-500",
      borderColor: "border-purple-500",
      buttonColor: "bg-purple-500 hover:bg-purple-600",
    },
    {
      id: "chatwoot",
      name: "Chatwoot",
      icon: <MessageCircleMore className="w-8 h-8" />,
      connected: 0,
      color: "bg-orange-500",
      borderColor: "border-orange-500",
      buttonColor: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  const handleConnectChannel = (channelName: string) => {
    toast.info(`Conectando ao ${channelName}...`);
  };

  const handleStartCampaign = (campaignName: string) => {
    toast.info(`Iniciando campanha: ${campaignName}`);
  };

  const handleWizardWaSeller = () => {
    toast.info("Abrindo Wizard WaSeller...");
  };

  const handleNewCampaign = () => {
    toast.info("Criando nova campanha rápida...");
  };

  const getEstadoBadge = (status: Campaign["status"]) => {
    const variants: Record<Campaign["status"], { label: string; className: string }> = {
      draft: { label: "draft", className: "bg-gray-600 text-white" },
      active: { label: "active", className: "bg-green-600 text-white" },
      paused: { label: "paused", className: "bg-yellow-600 text-white" },
      completed: { label: "completed", className: "bg-blue-600 text-white" },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Campañas</h1>
            <p className="text-gray-400">Gestiona tus campañas de mensajes</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleWizardWaSeller}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Wizard WaSeller
            </Button>
            <Button
              onClick={handleNewCampaign}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Campaña (Rápida)
            </Button>
          </div>
        </div>

        {/* Canais Conectados */}
        <div className="mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Canais Conectados</h2>
            <p className="text-gray-400 mb-6">Conecte seus canais antes de criar campanhas</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {channels.map((channel) => (
                <Card
                  key={channel.id}
                  className={`bg-black border-2 ${channel.borderColor} p-6 flex flex-col items-center`}
                >
                  <div className={`${channel.color} rounded-full p-4 mb-4`}>
                    <div className="text-white">{channel.icon}</div>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">{channel.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {channel.total ? `${channel.connected}/${channel.total} conectados` : `${channel.connected} conectados`}
                  </p>
                  <div className="flex gap-2 w-full">
                    {channel.id === "whatsapp" && (
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                        onClick={() => toast.info("Visualizando todos os canais WhatsApp...")}
                      >
                        Ver Todos
                      </Button>
                    )}
                    <Button
                      className={`flex-1 ${channel.buttonColor} text-white`}
                      onClick={() => handleConnectChannel(channel.name)}
                    >
                      Conectar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Todas las Campañas */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Todas las Campañas ({campaigns.length})
          </h2>
          <p className="text-gray-400 mb-6">Historial completo de campañas de mensajes</p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Nombre</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Estado</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">País</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Leads</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Enviados</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Respuestas</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Fecha</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4 px-4 text-white">{campaign.name}</td>
                    <td className="py-4 px-4">{getEstadoBadge(campaign.status)}</td>
                    <td className="py-4 px-4 text-gray-300">{campaign.country}</td>
                    <td className="py-4 px-4 text-gray-300">{campaign.leads}</td>
                    <td className="py-4 px-4 text-gray-300">{campaign.sent}</td>
                    <td className="py-4 px-4 text-gray-300">{campaign.responses}</td>
                    <td className="py-4 px-4 text-gray-300">{campaign.date}</td>
                    <td className="py-4 px-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-gray-800"
                        onClick={() => handleStartCampaign(campaign.name)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
