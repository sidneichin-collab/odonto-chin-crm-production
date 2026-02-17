/**
 * Rescheduling Notification Component
 * Shows sound popup when patient requests rescheduling
 * Displays patient name + WhatsApp link for secretary
 */

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ReschedulingRequest {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  message: string;
  timestamp: Date;
}

export default function ReschedulingNotification() {
  const [pendingRequests, setPendingRequests] = useState<ReschedulingRequest[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ReschedulingRequest | null>(null);
  const [audio] = useState(() => {
    // Create notification sound (simple beep using Web Audio API)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  });

  // Poll for new rescheduling requests every 10 seconds
  const { data: requests } = trpc.reschedule.getPendingAlerts.useQuery(undefined, {
    refetchInterval: 10000, // 10 seconds
  });

  const markAsHandledMutation = trpc.reschedule.markAsViewed.useMutation();

  useEffect(() => {
    if (!requests || requests.length === 0) return;

    // Check for new requests
    const newRequests = requests.filter(
      (req: any) => !pendingRequests.find((p) => p.id === req.id)
    );

    if (newRequests.length > 0) {
      // Play sound
      playNotificationSound();

      // Show popup for first new request
      const firstNew = newRequests[0];
      setCurrentRequest(firstNew);
      setShowPopup(true);

      // Update pending list
      setPendingRequests(requests);
    }
  }, [requests]);

  const playNotificationSound = () => {
    // Play a simple beep sound
    const oscillator = audio.createOscillator();
    const gainNode = audio.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audio.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audio.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.5);

    oscillator.start(audio.currentTime);
    oscillator.stop(audio.currentTime + 0.5);

    // Play 3 beeps
    setTimeout(() => {
      const osc2 = audio.createOscillator();
      const gain2 = audio.createGain();
      osc2.connect(gain2);
      gain2.connect(audio.destination);
      osc2.frequency.value = 800;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, audio.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.5);
      osc2.start(audio.currentTime);
      osc2.stop(audio.currentTime + 0.5);
    }, 600);

    setTimeout(() => {
      const osc3 = audio.createOscillator();
      const gain3 = audio.createGain();
      osc3.connect(gain3);
      gain3.connect(audio.destination);
      osc3.frequency.value = 800;
      osc3.type = "sine";
      gain3.gain.setValueAtTime(0.3, audio.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.5);
      osc3.start(audio.currentTime);
      osc3.stop(audio.currentTime + 0.5);
    }, 1200);
  };

  const handleWhatsAppClick = () => {
    if (!currentRequest) return;

    // Open WhatsApp
    const phone = currentRequest.patientPhone.replace(/\D/g, ""); // Remove non-digits
    window.open(`https://wa.me/${phone}`, "_blank");

    // Mark as handled
      markAsHandledMutation.mutate({ alertId: currentRequest.id });

    // Close popup
    setShowPopup(false);
    setCurrentRequest(null);
  };

  const handleDismiss = () => {
    setShowPopup(false);
    setCurrentRequest(null);
  };

  return (
    <>
      {/* Notification Badge */}
      {pendingRequests.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            size="lg"
            className="relative shadow-lg"
            onClick={() => {
              if (pendingRequests.length > 0) {
                setCurrentRequest(pendingRequests[0]);
                setShowPopup(true);
              }
            }}
          >
            <Bell className="h-5 w-5 mr-2 animate-pulse" />
            Reagendamientos Pendientes
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {pendingRequests.length}
            </span>
          </Button>
        </div>
      )}

      {/* Popup Modal */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <Bell className="h-5 w-5 animate-pulse" />
              Solicitud de Reagendamiento
            </DialogTitle>
          </DialogHeader>

          {currentRequest && (
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Paciente:</p>
                <p className="text-2xl font-bold">{currentRequest.patientName}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                El paciente ha solicitado reagendar su cita. Por favor, contacte al paciente para coordinar una nueva fecha.
              </p>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleWhatsAppClick}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Abrir WhatsApp
                </Button>
                <Button variant="outline" onClick={handleDismiss}>
                  <X className="h-4 w-4 mr-2" />
                  Cerrar
                </Button>
              </div>

              {pendingRequests.length > 1 && (
                <p className="text-xs text-center text-muted-foreground">
                  {pendingRequests.length - 1} solicitudes más pendientes
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
