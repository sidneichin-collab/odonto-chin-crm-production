import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings,
  Users,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Mail,
  Phone,
  MessageSquare,
  Save,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState("general");

  // Mock data - será substituído por dados reais do backend
  const users = [
    {
      id: 1,
      name: "Dr. Sidnei Chin",
      email: "sidnei@ortobom.com",
      role: "admin",
      status: "active",
      clinics: ["Bolivia - La Paz", "Paraguay - Asunción"]
    },
    {
      id: 2,
      name: "Dra. María González",
      email: "maria@ortobom.com",
      role: "doctor",
      status: "active",
      clinics: ["Bolivia - La Paz"]
    },
    {
      id: 3,
      name: "Ana Silva",
      email: "ana@ortobom.com",
      role: "secretary",
      status: "active",
      clinics: ["Bolivia - La Paz"]
    }
  ];

  const clinics = [
    {
      id: 1,
      name: "ORTOBOM ODONTOLOGÍA - La Paz",
      country: "Bolivia",
      address: "Av. Principal 123, La Paz",
      phone: "+591 7654-3210",
      whatsapp: "+591 7654-3210",
      email: "lapaz@ortobom.com",
      chairs: {
        orthodontics: 3,
        general: 1
      },
      status: "active"
    },
    {
      id: 2,
      name: "ORTOBOM ODONTOLOGÍA - Asunción",
      country: "Paraguay",
      address: "Av. Central 456, Asunción",
      phone: "+595 987-654321",
      whatsapp: "+595 987-654321",
      email: "asuncion@ortobom.com",
      chairs: {
        orthodontics: 2,
        general: 1
      },
      status: "active"
    }
  ];

  const integrations = [
    {
      id: 1,
      name: "WhatsApp Business",
      type: "messaging",
      status: "connected",
      config: {
        apiUrl: "https://evolution-api.com",
        instanceName: "ortobom-main"
      }
    },
    {
      id: 2,
      name: "Messenger",
      type: "messaging",
      status: "disconnected",
      config: {}
    },
    {
      id: 3,
      name: "n8n Automation",
      type: "automation",
      status: "connected",
      config: {
        webhookUrl: "https://n8n.ortobom.com/webhook"
      }
    },
    {
      id: 4,
      name: "Chatwoot",
      type: "support",
      status: "disconnected",
      config: {}
    },
    {
      id: 5,
      name: "Email (SMTP)",
      type: "email",
      status: "connected",
      config: {
        host: "smtp.gmail.com",
        port: 587,
        from: "noreply@ortobom.com"
      }
    }
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "doctor": return "Doctor";
      case "secretary": return "Secretaria";
      case "manager": return "Gerente";
      default: return "Usuario";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-500";
      case "doctor": return "bg-blue-500";
      case "secretary": return "bg-green-500";
      case "manager": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "messaging": return <MessageSquare className="h-5 w-5" />;
      case "email": return <Mail className="h-5 w-5" />;
      case "automation": return <Settings className="h-5 w-5" />;
      case "support": return <Phone className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Settings className="h-8 w-8 mr-3 text-blue-500" />
          Configuraciones
        </h1>
        <p className="text-gray-400">Gestiona usuarios, clínicas e integraciones del sistema</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="clinics" className="data-[state=active]:bg-blue-600">
            <Building2 className="h-4 w-4 mr-2" />
            Clínicas
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-blue-600">
            <Globe className="h-4 w-4 mr-2" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Configuraciones Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Name */}
              <div className="space-y-2">
                <Label htmlFor="systemName" className="text-white">Nombre del Sistema</Label>
                <Input
                  id="systemName"
                  defaultValue="ORTOBOM ODONTOLOGÍA CRM"
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-white">Idioma</Label>
                <select
                  id="language"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  defaultValue="es"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-white">Zona Horaria</Label>
                <select
                  id="timezone"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  defaultValue="America/La_Paz"
                >
                  <option value="America/La_Paz">Bolivia (GMT-4)</option>
                  <option value="America/Asuncion">Paraguay (GMT-4)</option>
                  <option value="America/Panama">Panamá (GMT-5)</option>
                  <option value="America/Santiago">Chile (GMT-3)</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-white">Moneda</Label>
                <select
                  id="currency"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  defaultValue="BOB"
                >
                  <option value="BOB">Boliviano (BS)</option>
                  <option value="PYG">Guaraní (Gs)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="CLP">Peso Chileno (CLP)</option>
                </select>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Gestión de Usuarios</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge className={user.status === "active" ? "bg-green-500" : "bg-red-500"}>
                            {user.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400 flex items-center">
                            <Mail className="h-3 w-3 mr-2" />
                            {user.email}
                          </p>
                          <p className="text-sm text-gray-400 flex items-center">
                            <Building2 className="h-3 w-3 mr-2" />
                            {user.clinics.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-700 hover:text-white">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Clinics Tab */}
        <TabsContent value="clinics" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Gestión de Clínicas</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Clínica
            </Button>
          </div>

          <div className="space-y-4">
            {clinics.map((clinic) => (
              <Card key={clinic.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{clinic.name}</h3>
                        <Badge className="bg-blue-500">{clinic.country}</Badge>
                        <Badge className={clinic.status === "active" ? "bg-green-500" : "bg-red-500"}>
                          {clinic.status === "active" ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{clinic.address}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-700 hover:text-white">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Teléfono</p>
                      <p className="text-sm text-white flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {clinic.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">WhatsApp</p>
                      <p className="text-sm text-white flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {clinic.whatsapp}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-sm text-white flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {clinic.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Sillas</p>
                      <p className="text-sm text-white">
                        {clinic.chairs.orthodontics} Orto / {clinic.chairs.general} Clínico
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Integraciones Externas</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Integración
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        {getIntegrationIcon(integration.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                        <Badge className={integration.status === "connected" ? "bg-green-500" : "bg-red-500"}>
                          {integration.status === "connected" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Conectado
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Desconectado
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {integration.status === "connected" && Object.keys(integration.config).length > 0 && (
                    <div className="bg-gray-800 p-3 rounded-lg mb-4">
                      {Object.entries(integration.config).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between mb-2 last:mb-0">
                          <span className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-xs text-white font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {integration.status === "connected" ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Configurar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-500 border-red-500 hover:bg-red-700 hover:text-white">
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Conectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Preferencias de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Notificaciones por Email</Label>
                  <p className="text-sm text-gray-400">Recibir alertas y reportes por correo electrónico</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* WhatsApp Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Notificaciones por WhatsApp</Label>
                  <p className="text-sm text-gray-400">Recibir alertas urgentes por WhatsApp</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Appointment Reminders */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Recordatorios de Citas</Label>
                  <p className="text-sm text-gray-400">Enviar recordatorios automáticos a pacientes</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Rescheduling Alerts */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Alertas de Reagendamiento</Label>
                  <p className="text-sm text-gray-400">Notificar cuando un paciente solicita reagendar</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Channel Health Alerts */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Alertas de Salud de Canales</Label>
                  <p className="text-sm text-gray-400">Notificar problemas con canales de comunicación</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Daily Reports */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Reportes Diarios</Label>
                  <p className="text-sm text-gray-400">Recibir resumen diario de actividades</p>
                </div>
                <Switch />
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Configuraciones de Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Autenticación de Dos Factores (2FA)</Label>
                  <p className="text-sm text-gray-400">Agregar una capa extra de seguridad a tu cuenta</p>
                </div>
                <Switch />
              </div>

              {/* Session Timeout */}
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout" className="text-white">Tiempo de Sesión (minutos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  defaultValue="30"
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              {/* Password Policy */}
              <div className="space-y-2">
                <Label className="text-white">Política de Contraseñas</Label>
                <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm text-white">Mínimo 8 caracteres</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm text-white">Incluir mayúsculas y minúsculas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm text-white">Incluir números</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <span className="text-sm text-white">Incluir caracteres especiales</span>
                  </div>
                </div>
              </div>

              {/* API Keys */}
              <div className="space-y-2">
                <Label className="text-white">API Keys</Label>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Production Key</span>
                    <Button size="sm" variant="outline">
                      <Key className="h-3 w-3 mr-1" />
                      Regenerar
                    </Button>
                  </div>
                  <code className="text-xs text-white font-mono">sk_prod_••••••••••••••••</code>
                </div>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuraciones
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
