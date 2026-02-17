// @ts-nocheck
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Phone, 
  Mail,
  Eye,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  Upload
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Patients() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setEstadoFilter] = useState<string>("all");

  const { data: patients, isLoading } = trpc.patients.list.useQuery({
    searchTerm: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const statusConfig = {
    active: {
      label: "Activo",
      icon: CheckCircle2,
      className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    },
    inactive: {
      label: "Inactivo",
      icon: MinusCircle,
      className: "bg-muted text-muted-foreground border-muted-foreground/20",
    },
    defaulter: {
      label: "Inadimplente",
      icon: AlertCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    at_risk: {
      label: "Em Risco",
      icon: AlertCircle,
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
            <p className="text-muted-foreground mt-1">
              Gestione todos los pacientes de la clínica
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/patients/new")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Paciente
            </Button>
            <Button 
              onClick={() => navigate("/import")}
              variant="outline"
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
            <CardDescription>
              Busque y filtre pacientes por nombre, CI, teléfono o estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, CI, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="defaulter">Inadimplentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                `${patients?.length || 0} paciente(s) encontrado(s)`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>CI</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : patients && patients.length > 0 ? (
                    patients.map((patient) => {
                      const status = statusConfig[patient.status as keyof typeof statusConfig] ?? {
                        label: "Desconocido",
                        icon: AlertCircle,
                        className: "bg-muted text-muted-foreground border-muted-foreground/20",
                      };
                      const EstadoIcon = status.icon;
                      
                      return (
                        <TableRow key={patient.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {patient.fullName}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {patient.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <span>{patient.phone}</span>
                                </div>
                              )}
                              {patient.email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  <span>{patient.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {patient.ci || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.className}>
                              <EstadoIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/patients/${patient.id}`)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-12 h-12 text-muted-foreground/50" />
                          <div>
                            <p className="font-medium">Ningún paciente encontrado</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {searchTerm || statusFilter !== "all" 
                                ? "Intente ajustar los filtros de búsqueda" 
                                : "Comience registrando un nuevo paciente"}
                            </p>
                          </div>
                          {!searchTerm && statusFilter === "all" && (
                            <Button 
                              onClick={() => navigate("/patients/new")}
                              className="gap-2 mt-2"
                            >
                              <Plus className="w-4 h-4" />
                              Registrar Primer Paciente
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
