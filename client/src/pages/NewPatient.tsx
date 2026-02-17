import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Upload, X } from "lucide-react";

export default function NewPatient() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; phone: string; email: string | null } | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    ci: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: "",
    email: "",
    birthDate: "",
    address: "",
    treatmentType: "orthodontics" as "orthodontics" | "general_clinic" | "both",
    origin: "",
    notes: "",
  });
  
  const searchPatients = trpc.patients.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 && !selectedPatient }
  );

  const createPatientMutation = trpc.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente creado exitosamente");
      navigate("/patients");
    },
    onError: (error) => {
      toast.error(`Error al crear paciente: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setIdImage(null);
    setIdImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Upload image to S3 if exists
      let idImageUrl = null;
      if (idImage) {
        // For now, skip image upload
        // In production, use storagePut from server
        console.log("Image upload not implemented yet");
      }

      createPatientMutation.mutate({
        fullName: formData.name,
        cpf: formData.ci || undefined,
        phone: formData.phone,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        email: formData.email || undefined,
        birthDate: formData.birthDate || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error("Error creating patient:", error);
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/patients")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Paciente</h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados do paciente para cadastro
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Campos marcados com * são obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Search */}
              {!selectedPatient && (
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Paciente Existente</Label>
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o teléfono (+595, 0995, 995...)"  
                  />
                  {searchPatients.data && searchPatients.data.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {searchPatients.data.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setFormData(prev => ({
                              ...prev,
                              name: patient.name,
                              phone: patient.phone,
                              email: patient.email || "",
                            }));
                            setSearchQuery("");
                          }}
                          className="w-full p-3 text-left hover:bg-accent transition-colors"
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">{patient.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Ou preencha os campos abaixo para criar novo paciente
                  </p>
                </div>
              )}
              
              {selectedPatient && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/50">
                  <div>
                    <div className="font-medium">{selectedPatient.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedPatient.phone}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null);
                      setFormData({
                        name: "",
                        ci: "",
                        phone: "",
                        emergencyContact: "",
                        emergencyPhone: "",
                        email: "",
                        birthDate: "",
                        address: "",
                        treatmentType: "orthodontics",
                        origin: "",
                        notes: "",
                      });
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Juan Pérez González"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ci">CI (Cédula) *</Label>
                  <Input
                    id="ci"
                    value={formData.ci}
                    onChange={(e) => updateField("ci", e.target.value)}
                    placeholder="1234567"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+595981234567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="paciente@email.com"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => updateField("emergencyContact", e.target.value)}
                    placeholder="María Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField("emergencyPhone", e.target.value)}
                    placeholder="+595981234567"
                  />
                </div>
              </div>

              {/* Birth Date and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección/Ubicación</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Calle 123, Barrio Centro"
                  />
                </div>
              </div>

              {/* Treatment Type and Origin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="treatmentType">Tipo de Tratamiento *</Label>
                  <Select
                    value={formData.treatmentType}
                    onValueChange={(value: any) => updateField("treatmentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orthodontics">Ortodoncia</SelectItem>
                      <SelectItem value="general_clinic">Clínica General</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origin">Origen</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => updateField("origin", e.target.value)}
                    placeholder="Referencia, Redes Sociales, etc."
                  />
                </div>
              </div>

              {/* ID Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="idImage">Imagen de Cédula</Label>
                {!idImagePreview ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="idImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="idImage"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Clique para selecionar arquivo
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG até 5MB
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={idImagePreview}
                      alt="Preview da cédula"
                      className="w-full h-48 object-contain rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Observações adicionais sobre o paciente..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/patients")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Paciente"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
