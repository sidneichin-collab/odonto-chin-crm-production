import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * COMPONENTE CRÍTICO: AlertSoundPopup
 * 
 * Características:
 * - ✅ Sonido crítico de 3 segundos (800Hz)
 * - ✅ Popup piscante (rojo ↔ blanco, 500ms)
 * - ✅ Contador grande y visible
 * - ✅ Texto urgente en español
 * - ✅ FUERZA secretaria a tomar acción
 * - ✅ Máxima confiabilidad
 */

interface AlertSoundPopupProps {
  isActive: boolean;
  count: number;
  onClose: () => void;
  onViewPatients?: () => void;
}

export function AlertSoundPopup({
  isActive,
  count,
  onClose,
  onViewPatients,
}: AlertSoundPopupProps) {
  const [isFlashing, setIsFlashing] = useState(true);

  /**
   * FASE 1: Reproducir sonido crítico cuando alerta se activa
   */
  useEffect(() => {
    if (!isActive) return;

    playAlertSound();
  }, [isActive]);

  /**
   * FASE 2: Efecto de parpadeo (rojo ↔ blanco)
   */
  useEffect(() => {
    if (!isActive) {
      setIsFlashing(false);
      return;
    }

    const interval = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 500); // Parpadea cada 500ms

    return () => clearInterval(interval);
  }, [isActive]);

  /**
   * FASE 3: Reproducir sonido crítico
   */
  const playAlertSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear oscilador para sonido de alerta
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Sonido de alerta: 800Hz, 3 segundos, volumen alto
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      // Volumen alto (0.5 = 50%)
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 3);
    } catch (error) {
      console.error('[Alert Sound] Error playing sound:', error);
    }
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Overlay oscuro semi-transparente */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />

      {/* Popup piscante */}
      <div
        className={`
          relative z-10 pointer-events-auto
          rounded-2xl shadow-2xl
          p-8 max-w-md w-full mx-4
          transition-colors duration-500
          ${
            isFlashing
              ? 'bg-red-600 border-4 border-red-700'
              : 'bg-white border-4 border-red-600'
          }
        `}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className={`
            absolute top-4 right-4
            p-2 rounded-full
            transition-colors duration-500
            ${
              isFlashing
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          <X size={24} />
        </button>

        {/* Contenido */}
        <div className="text-center space-y-6">
          {/* Ícono de alerta */}
          <div
            className={`
              text-6xl animate-bounce
              ${isFlashing ? 'text-white' : 'text-red-600'}
            `}
          >
            ⚠️
          </div>

          {/* Título urgente */}
          <h2
            className={`
              text-3xl font-bold
              ${isFlashing ? 'text-white' : 'text-red-600'}
            `}
          >
            ¡ALERTA CRÍTICA!
          </h2>

          {/* Contador grande */}
          <div className="space-y-2">
            <div
              className={`
                text-7xl font-black
                ${isFlashing ? 'text-white' : 'text-red-600'}
              `}
            >
              {count}
            </div>
            <p
              className={`
                text-xl font-semibold
                ${isFlashing ? 'text-white' : 'text-gray-700'}
              `}
            >
              Pacientes Sin Agendar
            </p>
          </div>

          {/* Mensaje urgente */}
          <p
            className={`
              text-lg font-semibold leading-relaxed
              ${isFlashing ? 'text-white' : 'text-gray-700'}
            `}
          >
            La secretaria DEBE disminuir este número hoy.
            <br />
            Contacta a los pacientes ahora.
          </p>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4">
            {/* Botón Ver Pacientes */}
            {onViewPatients && (
              <button
                onClick={onViewPatients}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-bold
                  transition-all duration-500
                  ${
                    isFlashing
                      ? 'bg-white text-red-600 hover:bg-gray-100'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }
                `}
              >
                Ver Pacientes
              </button>
            )}

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className={`
                flex-1 py-3 px-4 rounded-lg font-bold
                transition-all duration-500
                ${
                  isFlashing
                    ? 'bg-red-700 text-white hover:bg-red-800'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }
              `}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Indicador de sonido */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div
            className={`
              w-3 h-3 rounded-full animate-pulse
              ${isFlashing ? 'bg-white' : 'bg-red-600'}
            `}
          />
          <span
            className={`
              text-sm font-semibold
              ${isFlashing ? 'text-white' : 'text-gray-700'}
            `}
          >
            Sonido activo
          </span>
        </div>
      </div>
    </div>
  );
}

export default AlertSoundPopup;
