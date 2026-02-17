import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Image,
  Video,
  Mic,
  FileText,
  Send,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Patient {
  id: number;
  fullName: string;
  nickname?: string | null;
  phone: string;
}

interface WhatsAppMessageComposerProps {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function WhatsAppMessageComposer({
  open,
  onClose,
  patient,
}: WhatsAppMessageComposerProps) {
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null);

  const { data: templates, isLoading: templatesLoading } =
    trpc.messageTemplates.list.useQuery();

  const sendMessageMutation = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensaje enviado exitosamente!");
      handleClose();
    },
    onError: (error) => {
      toast.error(`Error al enviar mensaje: ${error.message}`);
    },
  });

  const handleClose = () => {
    setMessage("");
    setSelectedTemplate("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    onOpenChange(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates?.find((t) => t.id === parseInt(templateId));
    if (template && patient) {
      // Replace variables in template
      let content = template.bodyText;
      content = content.replace(/\{\{nome\}\}/g, patient.fullName);
      content = content.replace(/\{\{apelido\}\}/g, patient.nickname || patient.fullName);
      setMessage(content);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "audio") => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (16MB limit)
    if (file.size > 16 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. Máximo 16MB.");
      return;
    }

    setMediaFile(file);
    setMediaType(type);

    // Create preview for images and videos
    if (type === "image" || type === "video") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(file.name);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSend = async () => {
    if (!patient) return;

    if (!message.trim() && !mediaFile) {
      toast.error("Por favor, escribe un mensaje o selecciona un archivo.");
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        phone: patient.phone,
        message: message.trim(),
        mediaFile: mediaFile ? {
          name: mediaFile.name,
          type: mediaFile.type,
          size: mediaFile.size,
        } : undefined,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Enviar Mensaje WhatsApp</DialogTitle>
          <DialogDescription>
            Enviando mensaje a: <strong>{patient.fullName}</strong> ({patient.phone})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Seleccionar Template (Opcional)</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar template..." />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Cargando templates...
                    </div>
                  ) : templates && templates.length > 0 ? (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No hay templates disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                title="Crear nuevo template"
                onClick={() => {
                  // TODO: Open template editor
                  toast.info("Función de crear template próximamente");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              placeholder="Escribe tu mensaje aquí..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles: {"{"}{"{"} nome {"}"}{"}"},  {"{"}{"{"} apelido {"}"}{"}"}, {"{"}{"{"} data {"}"}{"}"},  {"{"}{"{"} hora {"}"}{"}"}, {"{"}{"{"} dra {"}"}{"}"} 
            </p>
          </div>

          {/* Media Upload Buttons */}
          <div className="space-y-2">
            <Label>Adjuntar Archivo (Opcional)</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={!!mediaFile}
              >
                <Image className="h-4 w-4 mr-2" />
                Imagen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("video-upload")?.click()}
                disabled={!!mediaFile}
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("audio-upload")?.click()}
                disabled={!!mediaFile}
              >
                <Mic className="h-4 w-4 mr-2" />
                Audio
              </Button>
            </div>

            {/* Hidden File Inputs */}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "image")}
            />
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "video")}
            />
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "audio")}
            />
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative border-2 border-dashed rounded-lg p-4">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveMedia}
              >
                <X className="h-4 w-4" />
              </Button>

              {mediaType === "image" && (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded"
                />
              )}
              {mediaType === "video" && (
                <video
                  src={mediaPreview}
                  controls
                  className="max-h-48 mx-auto rounded"
                />
              )}
              {mediaType === "audio" && (
                <div className="flex items-center gap-3 justify-center">
                  <Mic className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{mediaPreview}</p>
                    <p className="text-sm text-muted-foreground">
                      {mediaFile && `${(mediaFile.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendMessageMutation.isPending || (!message.trim() && !mediaFile)}
            className="bg-green-600 hover:bg-green-700"
          >
            {sendMessageMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensaje
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
