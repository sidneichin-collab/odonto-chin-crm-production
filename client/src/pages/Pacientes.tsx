import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Search, User, Phone, Mail, AlertCircle, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const { data: patients, isLoading, refetch } = trpc.patients.list.useQuery();
  const createPatient = trpc.patients.create.useMutation();
  const updatePatient = trpc.patients.update.useMutation();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "M" as "M" | "F" | "Otro",
    email: "",
    phone: "",
    whatsappNumber: "",
    address: "",
    city: "",
    medicalHistory: "",
    allergies: "",
    medications: "",
    emergencyContact: "",
    emergencyPhone: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "M",
      email: "",
      phone: "",
      whatsappNumber: "",
      address: "",
      city: "",
      medicalHistory: "",
      allergies: "",
      medications: "",
      emergencyContact: "",
      emergencyPhone: "",
      notes: "",
    });
    setSelectedPatient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedPatient) {
        await updatePatient.mutateAsync({
          id: selectedPatient.id,
          ...formData,
        });
        toast.success("Paciente actualizado exitosamente");
      } else {
        await createPatient.mutateAsync(formData);
        toast.success("Paciente registrado exitosamente");
      }
      
      refetch();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al guardar paciente");
    }
  };

  const handleEdit = (patient: any) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : "",
      gender: patient.gender || "M",
      email: patient.email || "",
      phone: patient.phone || "",
      whatsappNumber: patient.whatsappNumber || "",
      address: patient.address || "",
      city: patient.city || "",
      medicalHistory: patient.medicalHistory || "",
      allergies: patient.allergies || "",
      medications: patient.medications || "",
      emergencyContact: patient.emergencyContact || "",
      emergencyPhone: patient.emergencyPhone || "",
      notes: patient.notes || "",
    });
    setIsDialogOpen(true);
  };

  const filteredPatients = patients?.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando pacientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
            <p className="text-muted-foreground mt-2">
              Gestión completa de pacientes de la clínica
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedPatient ? "Editar Paciente" : "Registrar Nuevo Paciente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Información Personal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nombre *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellido *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Género</Label>
                      <Select value={formData.gender} onValueChange={(value: any) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Información de Contacto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsappNumber">WhatsApp</Label>
                      <Input
                        id="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Historia Médica</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="medicalHistory">Historia Médica</Label>
                      <Textarea
                        id="medicalHistory"
                        value={formData.medicalHistory}
                        onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="allergies">Alergias</Label>
                      <Textarea
                        id="allergies"
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="medications">Medicamentos</Label>
                      <Textarea
                        id="medications"
                        value={formData.medications}
                        onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Contacto de Emergencia</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Nombre</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Teléfono</Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPatient.isPending || updatePatient.isPending}>
                    {createPatient.isPending || updatePatient.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients && filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {patient.firstName} {patient.lastName}
                        </CardTitle>
                        <Badge variant={patient.status === "Activo" ? "default" : "secondary"} className="mt-1">
                          {patient.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(patient)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.isAtRisk && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-3 p-2 bg-destructive/10 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Paciente en Riesgo</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron pacientes" : "No hay pacientes registrados"}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
