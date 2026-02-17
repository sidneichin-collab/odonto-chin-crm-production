import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Search,
  Filter,
  Clock,
  XCircle,
  CheckCircle2,
  Phone
} from "lucide-react";

export default function RelatorioInadimplencia() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - será substituído por dados reais do backend
  const overallStats = {
    totalPatients: 2580,
    defaulters: 398,
    defaultRate: 15.4,
    totalDebt: "45,230 BS",
    avgDebtPerPatient: "113.6 BS",
    trend: "down",
    improvement: "-2.3%"
  };

  const byAppointmentType = [
    {
      type: "Ortodoncia",
      total: 1234,
      defaulters: 146,
      defaultRate: 11.8,
      totalDebt: "21,900 BS",
      avgDebt: "150 BS",
      trend: "down"
    },
    {
      type: "Clínico General",
      total: 1346,
      defaulters: 252,
      defaultRate: 18.7,
      totalDebt: "23,330 BS",
      avgDebt: "92.6 BS",
      trend: "up"
    }
  ];

  const defaultersList = [
    {
      id: 1,
      name: "María González",
      phone: "+591 7654-3210",
      appointmentType: "Ortodoncia",
      appointmentDate: "05/02/2026",
      appointmentTime: "14:00",
      noShowCount: 1,
      debt: "150 BS",
      lastContact: "06/02/2026",
      status: "pending_contact",
      riskLevel: "medium"
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      phone: "+591 7654-3213",
      appointmentType: "Clínico General",
      appointmentDate: "04/02/2026",
      appointmentTime: "15:00",
      noShowCount: 3,
      debt: "278 BS",
      lastContact: "05/02/2026",
      status: "high_risk",
      riskLevel: "high"
    },
    {
      id: 3,
      name: "Ana Silva",
      phone: "+591 7654-3214",
      appointmentType: "Ortodoncia",
      appointmentDate: "03/02/2026",
      appointmentTime: "10:00",
      noShowCount: 1,
      debt: "150 BS",
      lastContact: "07/02/2026",
      status: "contacted",
      riskLevel: "low"
    },
    {
      id: 4,
      name: "Pedro Martínez",
      phone: "+591 7654-3215",
      appointmentType: "Clínico General",
      appointmentDate: "02/02/2026",
      appointmentTime: "16:00",
      noShowCount: 2,
      debt: "185 BS",
      lastContact: "03/02/2026",
      status: "pending_contact",
      riskLevel: "medium"
    },
    {
      id: 5,
      name: "Lucía Fernández",
      phone: "+591 7654-3216",
      appointmentType: "Ortodoncia",
      appointmentDate: "01/02/2026",
      appointmentTime: "11:00",
      noShowCount: 4,
      debt: "600 BS",
      lastContact: "01/02/2026",
      status: "high_risk",
      riskLevel: "critical"
    }
  ];

  const filteredDefaulters = defaultersList.filter(d => {
    if (selectedType !== "all" && d.appointmentType !== selectedType) return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "critical": return "Crítico";
      case "high": return "Alto";
      case "medium": return "Medio";
      case "low": return "Bajo";
      default: return "Normal";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_contact": return "bg-yellow-500";
      case "contacted": return "bg-blue-500";
      case "high_risk": return "bg-red-500";
      case "resolved": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_contact": return "Pendiente Contacto";
      case "contacted": return "Contactado";
      case "high_risk": return "Alto Riesgo";
      case "resolved": return "Resuelto";
      default: return "Desconocido";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Relatório de Inadimplência</h1>
          <p className="text-gray-400">Análisis de pacientes con no-show y deuda pendiente</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Pacientes</p>
                <p className="text-2xl font-bold text-white">{overallStats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Inadimplentes</p>
                <p className="text-2xl font-bold text-red-500">{overallStats.defaulters}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa Inadimplência</p>
                <p className="text-2xl font-bold text-red-500">{overallStats.defaultRate}%</p>
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {overallStats.improvement}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Deuda Total</p>
                <p className="text-2xl font-bold text-white">{overallStats.totalDebt}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Deuda Promedio</p>
                <p className="text-2xl font-bold text-white">{overallStats.avgDebtPerPatient}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Appointment Type */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Inadimplência por Tipo de Cita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {byAppointmentType.map((item, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-white">{item.type}</h3>
                    <Badge className={item.trend === "down" ? "bg-green-500" : "bg-red-500"}>
                      {item.trend === "down" ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                      {item.trend === "down" ? "Mejorando" : "Empeorando"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Tasa Inadimplência</p>
                    <p className="text-2xl font-bold text-red-500">{item.defaultRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Pacientes</p>
                    <p className="text-lg font-semibold text-white">{item.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Inadimplentes</p>
                    <p className="text-lg font-semibold text-red-500">{item.defaulters}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Deuda Total</p>
                    <p className="text-lg font-semibold text-white">{item.totalDebt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Deuda Promedio</p>
                    <p className="text-lg font-semibold text-white">{item.avgDebt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tasa</p>
                    <Progress value={item.defaultRate} className="h-2 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre de paciente..."
                className="pl-10 bg-gray-800 border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Button
                size="sm"
                variant={selectedType === "all" ? "default" : "outline"}
                onClick={() => setSelectedType("all")}
                className={selectedType === "all" ? "bg-blue-600" : ""}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={selectedType === "Ortodoncia" ? "default" : "outline"}
                onClick={() => setSelectedType("Ortodoncia")}
                className={selectedType === "Ortodoncia" ? "bg-blue-600" : ""}
              >
                Ortodoncia
              </Button>
              <Button
                size="sm"
                variant={selectedType === "Clínico General" ? "default" : "outline"}
                onClick={() => setSelectedType("Clínico General")}
                className={selectedType === "Clínico General" ? "bg-blue-600" : ""}
              >
                Clínico General
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaulters List */}
      <div className="space-y-4">
        {filteredDefaulters.map((defaulter) => (
          <Card key={defaulter.id} className={`bg-gray-900 ${
            defaulter.riskLevel === "critical" ? "border-red-500 border-2" : 
            defaulter.riskLevel === "high" ? "border-orange-500" : 
            "border-gray-800"
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                {/* Patient Info */}
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{defaulter.name}</h3>
                      <Badge className={getRiskColor(defaulter.riskLevel)}>
                        {getRiskLabel(defaulter.riskLevel)}
                      </Badge>
                      <Badge className={getStatusColor(defaulter.status)}>
                        {getStatusLabel(defaulter.status)}
                      </Badge>
                      <Badge variant="outline">
                        {defaulter.appointmentType}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Teléfono</p>
                        <p className="text-sm text-white flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {defaulter.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Cita Perdida</p>
                        <p className="text-sm text-white flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {defaulter.appointmentDate} - {defaulter.appointmentTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">No-Shows</p>
                        <p className="text-sm text-white flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          {defaulter.noShowCount} {defaulter.noShowCount === 1 ? "vez" : "veces"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Deuda</p>
                        <p className="text-sm font-bold text-red-500 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {defaulter.debt}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Último Contacto</p>
                      <p className="text-sm text-white flex items-center">
                        <Clock className="h-3 w-3 mr-2" />
                        {defaulter.lastContact}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Reagendar
                  </Button>
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-700 hover:text-white">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar Resuelto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDefaulters.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
              <p className="text-gray-400">No se encontraron pacientes inadimplentes</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Key Insights */}
      <Card className="bg-orange-500/10 border-2 border-orange-500">
        <CardHeader>
          <CardTitle className="text-orange-500 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Insights Clave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-white">
            <li className="flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
              <span>La tasa de inadimplência en Clínico General (<strong>18.7%</strong>) es significativamente mayor que en Ortodoncia (<strong>11.8%</strong>).</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
              <span>Se identificaron <strong>5 pacientes</strong> con nivel de riesgo crítico que requieren atención inmediata.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span>La tasa de inadimplência general ha mejorado <strong>2.3%</strong> comparado con el período anterior.</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
              <span>La deuda total pendiente es de <strong>{overallStats.totalDebt}</strong> con un promedio de <strong>{overallStats.avgDebtPerPatient}</strong> por paciente.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
