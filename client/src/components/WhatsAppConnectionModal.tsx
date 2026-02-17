// @ts-nocheck
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  title: string;
}

export function WhatsAppConnectionModal({
  open,
  onOpenChange,
  sessionId,
  title,
}: WhatsAppConnectionModalProps) {
  const [initialized, setInitialized] = useState(false);

  // Initialize mutation
  const initializeMutation = trpc.whatsapp.initialize.useMutation({
    onSuccess: () => {
      setInitialized(true);
      toast.success("Inicializando WhatsApp...");
    },
    onError: (error) => {
      toast.error(error.messageText);
      onOpenChange(false);
    },
  });

  // Query status with polling
  const { data: status } = trpc.whatsapp.getEstado.useQuery(
    { sessionId },
    {
      refetchInterval: 2000, // Poll every 2 seconds
      enabled: open && initialized,
    }
  );

  // Initialize when modal opens
  useEffect(() => {
    if (open && !initialized && sessionId) {
      console.log('[WhatsAppConnectionModal] Initializing session:', sessionId);
      initializeMutation.mutate({ sessionId });
    }
  }, [open, initialized, sessionId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setInitialized(false);
    }
  }, [open]);

  // Close modal when connected
  useEffect(() => {
    if (status?.connected) {
      console.log('[WhatsAppConnectionModal] Connected successfully');
      toast.success("WhatsApp conectado com sucesso!");
      setTimeout(() => {
        onOpenChange(false);
        setInitialized(false);
      }, 1000);
    }
  }, [status?.connected, onOpenChange]);

  const qrCode = status?.qrCode || null;
  const currentEstado = status?.status || "initializing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado */}
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50">
            {qrCode ? (
              <>
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="text-sm font-medium">Aguardando escaneamento...</span>
              </>
            ) : currentEstado === "connected" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Conectado!</span>
              </>
            ) : currentEstado === "initializing" ? (
              <>
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="text-sm font-medium">Inicializando...</span>
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="text-sm font-medium">Gerando QR Code...</span>
              </>
            )}
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="space-y-3">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Escaneie o QR Code com seu WhatsApp</p>
                <ol className="text-xs text-muted-foreground space-y-1 text-left">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Toque em <strong>Configuraciones</strong> → <strong>Aparelhos conectados</strong></li>
                  <li>3. Toque em <strong>Conectar aparelho</strong></li>
                  <li>4. Aponte a câmera para este QR Code</li>
                </ol>
              </div>
            </div>
          )}

          {/* Loading */}
          {!qrCode && currentEstado === "initializing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setInitialized(false);
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
