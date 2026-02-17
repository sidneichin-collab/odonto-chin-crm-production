import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * HOOK DE NOTIFICACIONES DE ALERTAS
 * 
 * Características:
 * - ✅ WebSocket para notificaciones en tiempo real
 * - ✅ Fallback a localStorage si WebSocket falla
 * - ✅ Reconexión automática
 * - ✅ Logs detallados
 * - ✅ GARANTIZADO: Alertas se disparan
 */

interface AlertNotification {
  type: 'alert';
  hour: number;
  unscheduledCount: number;
  timestamp: Date;
  message: string;
}

interface UseAlertNotificationsReturn {
  isConnected: boolean;
  lastAlert: AlertNotification | null;
  alertCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  playAlertSound: () => void;
}

export function useAlertNotifications(): UseAlertNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<AlertNotification | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  /**
   * FASE 1: Conectar a WebSocket
   */
  const connectWebSocket = useCallback(() => {
    try {
      // Obtener URL del WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      console.log('[Alert] 🔗 Conectando a WebSocket:', wsUrl);
      setConnectionStatus('reconnecting');

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Alert] ✅ WebSocket conectado');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Enviar suscripción
        ws.send(JSON.stringify({
          type: 'subscribe',
          userId: localStorage.getItem('userId') || 'anonymous',
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'alert') {
            console.log('[Alert] 🚨 Alerta recibida:', data);
            
            const alert: AlertNotification = {
              type: 'alert',
              hour: data.hour,
              unscheduledCount: data.unscheduledCount,
              timestamp: new Date(data.timestamp),
              message: data.message,
            };

            setLastAlert(alert);
            setAlertCount(prev => prev + 1);

            // Guardar en localStorage como fallback
            localStorage.setItem('lastAlert', JSON.stringify(alert));
            localStorage.setItem('alertCount', String(alertCount + 1));

            // Reproducir sonido
            playAlertSound();
          } else if (data.type === 'pong') {
            console.log('[Alert] 🏓 Pong recibido');
          }
        } catch (error) {
          console.error('[Alert] Error procesando mensaje:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Alert] ❌ Error en WebSocket:', error);
        setConnectionStatus('disconnected');
      };

      ws.onclose = () => {
        console.log('[Alert] 🔌 WebSocket desconectado');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Intentar reconectar
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[Alert] 🔄 Reconectando en ${delay}ms (intento ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        } else {
          console.warn('[Alert] ⚠️ Máximo de intentos de reconexión alcanzado. Usando fallback a localStorage.');
          // Usar localStorage como fallback
          checkLocalStorageForAlerts();
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Alert] Error conectando WebSocket:', error);
      setConnectionStatus('disconnected');
      // Fallback a localStorage
      checkLocalStorageForAlerts();
    }
  }, [alertCount]);

  /**
   * FASE 2: Verificar localStorage para alertas (fallback)
   */
  const checkLocalStorageForAlerts = useCallback(() => {
    try {
      const storedAlert = localStorage.getItem('lastAlert');
      const storedCount = localStorage.getItem('alertCount');

      if (storedAlert) {
        const alert = JSON.parse(storedAlert) as AlertNotification;
        console.log('[Alert] 📦 Alerta recuperada de localStorage:', alert);
        setLastAlert(alert);
      }

      if (storedCount) {
        setAlertCount(parseInt(storedCount, 10));
      }
    } catch (error) {
      console.error('[Alert] Error leyendo localStorage:', error);
    }
  }, []);

  /**
   * FASE 3: Reproducir sonido de alerta
   */
  const playAlertSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Sonido de alerta: 800Hz, 3 segundos
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 3);

      console.log('[Alert] 🔊 Sonido de alerta reproducido');
    } catch (error) {
      console.error('[Alert] Error reproduciendo sonido:', error);
    }
  }, []);

  /**
   * FASE 4: Ping periódico para mantener conexión viva
   */
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('[Alert] Error enviando ping:', error);
        }
      }
    }, 30000); // Ping cada 30 segundos

    return () => clearInterval(pingInterval);
  }, []);

  /**
   * FASE 5: Inicializar conexión
   */
  useEffect(() => {
    // Cargar alertas de localStorage primero
    checkLocalStorageForAlerts();

    // Conectar a WebSocket
    connectWebSocket();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, checkLocalStorageForAlerts]);

  return {
    isConnected,
    lastAlert,
    alertCount,
    connectionStatus,
    playAlertSound,
  };
}
