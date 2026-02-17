import { useEffect, useState } from 'react';
import { X, Phone, MessageCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RescheduleAlert {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  message: string;
  timestamp: Date;
}

export function RescheduleAlertPopup() {
  const [alerts, setAlerts] = useState<RescheduleAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<RescheduleAlert | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const utils = trpc.useUtils();
  const markAsViewedMutation = trpc.reschedule.markAsViewed.useMutation();
  const markAsResolvedMutation = trpc.reschedule.markAsResolved.useMutation();

  // Buscar alertas não visualizados a cada 10 segundos
  const { data: unviewedAlerts } = trpc.reschedule.getUnviewed.useQuery(undefined, {
    refetchInterval: 10000, // 10 segundos
  });

  useEffect(() => {
    if (unviewedAlerts && unviewedAlerts.length > 0) {
      setAlerts(unviewedAlerts);
      
      // Se não há alerta atual, mostrar o primeiro da lista
      if (!currentAlert) {
        const firstAlert = unviewedAlerts[0];
        setCurrentAlert(firstAlert);
        playAlertSound();
      }
    }
  }, [unviewedAlerts]);

  const playAlertSound = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Criar som de alerta usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequência do som (Hz)
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Repetir o som 3 vezes
    setTimeout(() => {
      if (currentAlert) {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }
    }, 600);
    
    setTimeout(() => {
      if (currentAlert) {
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.value = 800;
        osc3.type = 'sine';
        gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc3.start(audioContext.currentTime);
        osc3.stop(audioContext.currentTime + 0.5);
      }
      setIsPlaying(false);
    }, 1200);
  };

  const handleClose = async () => {
    if (!currentAlert) return;
    
    // Marcar como visualizado
    await markAsViewedMutation.mutateAsync({ alertId: currentAlert.id });
    
    // Remover da lista
    const remainingAlerts = alerts.filter(a => a.id !== currentAlert.id);
    setAlerts(remainingAlerts);
    
    // Mostrar próximo alerta se houver
    if (remainingAlerts.length > 0) {
      setCurrentAlert(remainingAlerts[0]);
      playAlertSound();
    } else {
      setCurrentAlert(null);
    }
    
    // Invalidar query para atualizar lista
    utils.reschedule.getUnviewed.invalidate();
  };

  const handleResolve = async () => {
    if (!currentAlert) return;
    
    // Marcar como resolvido
    await markAsResolvedMutation.mutateAsync({ alertId: currentAlert.id });
    
    // Remover da lista
    const remainingAlerts = alerts.filter(a => a.id !== currentAlert.id);
    setAlerts(remainingAlerts);
    
    // Mostrar próximo alerta se houver
    if (remainingAlerts.length > 0) {
      setCurrentAlert(remainingAlerts[0]);
      playAlertSound();
    } else {
      setCurrentAlert(null);
    }
    
    // Invalidar query para atualizar lista
    utils.reschedule.getUnviewed.invalidate();
  };

  const handleWhatsAppClick = () => {
    if (!currentAlert) return;
    
    const phone = currentAlert.patientPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  if (!currentAlert) return null;

  return (
    <Dialog open={!!currentAlert} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md animate-pulse border-red-500 border-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <MessageCircle className="h-5 w-5 animate-bounce" />
            🔔 Solicitação de Reagendamento
          </DialogTitle>
          <DialogDescription>
            Um paciente solicitou reagendamento. Por favor, entre em contato imediatamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-gray-700">Paciente:</span>
                <p className="text-lg font-bold text-gray-900">{currentAlert.patientName}</p>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Teléfono:</span>
                <p className="text-lg font-mono text-gray-900">{currentAlert.patientPhone}</p>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Mensagem:</span>
                <p className="text-gray-900 italic">"{currentAlert.message}"</p>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Horário:</span>
                <p className="text-sm text-gray-600">
                  {new Date(currentAlert.timestamp).toLocaleString('es-PY', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleWhatsAppClick}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Phone className="mr-2 h-4 w-4" />
              Abrir WhatsApp
            </Button>
            
            <Button
              onClick={handleResolve}
              variant="outline"
              className="flex-1"
            >
              Reagendado
            </Button>
          </div>
          
          {alerts.length > 1 && (
            <p className="text-sm text-center text-gray-500">
              {alerts.length - 1} alerta(s) pendente(s)
            </p>
          )}
          
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Cerrar (visualizado)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
