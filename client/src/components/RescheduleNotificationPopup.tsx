/**
 * Reschedule Notification Popup
 * Flashing visual alert with sound for reschedule requests
 * MANDATORY: Only secretary can reschedule appointments
 */

import { useEffect, useState, useRef } from 'react';
import { X, Calendar, Phone, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface RescheduleAlert {
  id: number;
  patientName: string;
  patientPhone: string;
  whatsappLink: string;
  appointmentDate: string;
  appointmentTime: string;
  requestedAt: string;
  clinicName: string;
}

interface RescheduleNotificationPopupProps {
  alerts: RescheduleAlert[];
  onDismiss: (alertId: number) => void;
  onContactPatient: (alert: RescheduleAlert) => void;
}

export function RescheduleNotificationPopup({
  alerts,
  onDismiss,
  onContactPatient
}: RescheduleNotificationPopupProps) {
  const [isFlashing, setIsFlashing] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedSound = useRef(false);

  // Play notification sound when new alert arrives
  useEffect(() => {
    if (alerts.length > 0 && !hasPlayedSound.current) {
      // Create notification sound (beep)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Play 3 beeps
      setTimeout(() => {
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
      }, 600);
      
      setTimeout(() => {
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
      }, 1200);
      
      hasPlayedSound.current = true;
    }
    
    // Reset sound flag when all alerts are dismissed
    if (alerts.length === 0) {
      hasPlayedSound.current = false;
    }
  }, [alerts.length]);

  // Flashing animation
  useEffect(() => {
    if (alerts.length === 0) {
      setIsFlashing(false);
      return;
    }

    setIsFlashing(true);
    const interval = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 500); // Flash every 500ms

    return () => clearInterval(interval);
  }, [alerts.length]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={`p-4 shadow-2xl border-2 transition-all duration-300 ${
            isFlashing
              ? 'border-red-500 bg-red-50 dark:bg-red-950 shadow-red-500/50'
              : 'border-orange-500 bg-orange-50 dark:bg-orange-950 shadow-orange-500/50'
          }`}
          style={{
            animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${isFlashing ? 'bg-red-500' : 'bg-orange-500'}`}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-red-700 dark:text-red-300">
                  🔔 SOLICITUD DE REAGENDAMIENTO
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(alert.requestedAt).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Patient Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-semibold">{alert.patientName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-600" />
              <span className="text-sm">{alert.patientPhone}</span>
            </div>
            <div className="text-sm text-gray-600">
              <strong>Cita actual:</strong> {alert.appointmentDate} às {alert.appointmentTime}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Clínica:</strong> {alert.clinicName}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => onContactPatient(alert)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contactar por WhatsApp
            </Button>
          </div>

          {/* Important Note */}
          <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>IMPORTANTE:</strong> Solo la secretaria puede reagendar citas. Contacte al paciente inmediatamente.
          </div>
        </Card>
      ))}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
