// @ts-nocheck - Type issues to be fixed
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Eye, Phone, Mail, Search, Plus, MessageCircle, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Pacientes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setEstadoFilter] = useState("all");
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    ci: "",
    rg: "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    emergencyContact: "",
    emergencyPhone: "",
    facebook: "",
    instagram: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  
  const { data: patients = [], isLoading } = trpc.patients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createPatient = trpc.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente creado exitosamente");
      utils.patients.list.invalidate();
      setNewPatientDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al crear paciente: " + error.messageText);
    },
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      ci: "",
      rg: "",
      birthDate: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      emergencyContact: "",
      emergencyPhone: "",
      facebook: "",
      instagram: "",
      notes: "",
    });
    setUploadedFile(null);
    setUploadPreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadPreview(null);
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.phone) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }

    createPatient.mutate({
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email || undefined,
      ci: formData.ci || undefined,
      rg: formData.rg || undefined,
      birthDate: formData.birthDate || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      emergencyContact: formData.emergencyContact || undefined,
      emergencyPhone: formData.emergencyPhone || undefined,
      facebook: formData.facebook || undefined,
      instagram: formData.instagram || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = statusFilter === "all" || patient.status === statusFilter;
    
    return matchesSearch && matchesEstado;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-cyan-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-blue-500",
      "bg-green-500",
    ];
    return colors[index % colors.length];
  };

  const getEstadoBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Activo", color: "green" },
      inactive: { label: "Inactivo", color: "gray" },
      defaulter: { label: "Moroso", color: "red" },
      at_risk: { label: "En Riesgo", color: "orange" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-${config.color}-500/10 text-${config.color}-400 text-sm font-medium`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-${config.color}-400`}></span>
        {config.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Pacientes</h1>
            <p className="text-gray-400 mt-1">Gestione sus pacientes</p>
          </div>
          <Button
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={() => setNewPatientDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-gray-900 rounded-lg p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              className="pl-10 bg-black border-gray-800 text-white placeholder:text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setEstadoFilter("all")}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setEstadoFilter("active")}
            >
              Activos
            </Button>
            <Button
              variant={statusFilter === "at_risk" ? "default" : "outline"}
              size="sm"
              onClick={() => setEstadoFilter("at_risk")}
            >
              En Riesgo
            </Button>
            <Button
              variant={statusFilter === "defaulter" ? "default" : "outline"}
              size="sm"
              onClick={() => setEstadoFilter("defaulter")}
            >
              Morosos
            </Button>
          </div>
        </div>

        {/* Tabela de Pacientes */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Nombre</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Contacto</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Documento</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Estado</th>
                <th className="text-right py-4 px-6 text-gray-400 font-medium text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, index) => (
                <tr
                  key={patient.id}
                  className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-bold text-sm`}
                      >
                        {getInitials(patient.fullName)}
                      </div>
                      <p className="text-white font-medium">{patient.fullName}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Phone className="w-3 h-3" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Mail className="w-3 h-3" />
                          <span>{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-400">{patient.ci || patient.rg || "—"}</span>
                  </td>
                  <td className="py-4 px-6">{getEstadoBadge(patient.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWhatsApp(patient.phone)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/pacientes/${patient.id}`)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Ningún paciente encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* New Patient Dialog */}
      <Dialog open={newPatientDialogOpen} onOpenChange={setNewPatientDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Paciente</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo paciente. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Información Personal</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ci">Cédula de Identidad</Label>
                  <Input
                    id="ci"
                    value={formData.ci}
                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    placeholder="1234567-8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rg">Cédula de Identidad</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
              </div>
            </div>

            {/* Upload de Cédula */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Cédula de Identidad (Imagen)</h3>
              
              {!uploadPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-cyan-500 hover:text-cyan-600">Subir archivo</span>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG hasta 10MB</p>
                </div>
              ) : (
                <div className="relative border rounded-lg p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <img src={uploadPreview} alt="Preview" className="max-h-48 mx-auto" />
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Ubicación</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Dirección Completa</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle, número, departamento"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Santiago"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Región</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="RM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Código Postal</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Contacto de Emergencia</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Nombre</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="María Pérez"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Teléfono</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="+56 9 8765 4321"
                  />
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Redes Sociales</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="@juanperez"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@juanperez"
                  />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPatientDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createPatient.isPending}>
              {createPatient.isPending ? "Guardando..." : "Guardar Paciente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
