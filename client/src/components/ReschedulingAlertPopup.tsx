/**
 * Rescheduling Alert Popup Component
 * 
 * MANDATORY WORKFLOW: Secretary-Only Rescheduling
 * Displays a flashing popup with audible alert when patient requests rescheduling
 */

import { useEffect, useState, useRef } from 'react';
import { X, Phone, Calendar, Clock, User, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReschedulingAlert {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  whatsappLink: string;
  originalDate: Date;
  originalTime: string;
  isRead: number;
  isResolved: number;
  createdAt: string;
}

export function ReschedulingAlertPopup() {
  const [alerts, setAlerts] = useState<ReschedulingAlert[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const lastAlertCountRef = useRef(0);

  // Poll for new alerts every 5 seconds
  const { data: alertsData, refetch } = trpc.rescheduling.getUnreadAlerts.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const markAsReadMutation = trpc.rescheduling.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAsResolvedMutation = trpc.rescheduling.markAsResolved.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (alertsData && alertsData.length > 0) {
      setAlerts(alertsData);

      // Check if there are NEW alerts (count increased)
      if (alertsData.length > lastAlertCountRef.current) {
        // New alert detected! Play sound and start flashing
        playAlertSound();
        setIsFlashing(true);

        // Stop flashing after 10 seconds
        setTimeout(() => {
          setIsFlashing(false);
        }, 10000);
      }

      lastAlertCountRef.current = alertsData.length;
    } else {
      setAlerts([]);
      lastAlertCountRef.current = 0;
    }
  }, [alertsData]);

  const playAlertSound = () => {
    try {
      // Create Web Audio API context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // 800 Hz tone
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }, i * 300); // 300ms between beeps
      }
    } catch (error) {
      console.error('[ReschedulingAlert] Failed to play sound:', error);
    }
  };

  const handleMarkAsRead = (alertId: number) => {
    markAsReadMutation.mutate({ alertId });
  };

  const handleMarkAsResolved = (alertId: number) => {
    markAsResolvedMutation.mutate({ alertId });
  };

  const handleOpenWhatsApp = (whatsappLink: string) => {
    window.open(whatsappLink, '_blank');
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md space-y-2">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={`p-4 shadow-2xl border-2 transition-all duration-300 ${
            isFlashing
              ? 'border-red-500 bg-red-50 dark:bg-red-950 animate-pulse'
              : 'border-orange-500 bg-orange-50 dark:bg-orange-950'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-orange-500 text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-orange-900 dark:text-orange-100">
                    🚨 Reagendamento Solicitado
                  </h3>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    {new Date(alert.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="space-y-2 bg-white dark:bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {alert.patientName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {alert.patientPhone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(alert.originalDate).toLocaleDateString('pt-BR')} às {alert.originalTime}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleOpenWhatsApp(alert.whatsappLink)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsResolved(alert.id)}
                >
                  Resolver
                </Button>
              </div>
            </div>

            {/* Close button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full"
              onClick={() => handleMarkAsRead(alert.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
