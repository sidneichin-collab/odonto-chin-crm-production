/**
 * Error Alert Service
 * Sends real-time error notifications when reminder sending fails
 */

export interface ErrorAlert {
  id: string;
  type: 'reminder_failed' | 'webhook_failed' | 'session_error' | 'network_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

class ErrorAlertService {
  private alerts: Map<string, ErrorAlert> = new Map();
  private subscribers: Set<(alert: ErrorAlert) => void> = new Set();

  /**
   * Create and broadcast an error alert
   */
  public createAlert(
    type: ErrorAlert['type'],
    severity: ErrorAlert['severity'],
    message: string,
    details?: Record<string, any>
  ): ErrorAlert {
    const alert: ErrorAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.set(alert.id, alert);
    this.broadcastAlert(alert);

    // Auto-resolve low severity alerts after 5 minutes
    if (severity === 'low') {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 5 * 60 * 1000);
    }

    return alert;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.broadcastAlert(alert);
    }
  }

  /**
   * Subscribe to alert notifications
   */
  public subscribe(callback: (alert: ErrorAlert) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Broadcast alert to all subscribers
   */
  private broadcastAlert(alert: ErrorAlert): void {
    this.subscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[ErrorAlertService] Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): ErrorAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get alerts by type
   */
  public getAlertsByType(type: ErrorAlert['type']): ErrorAlert[] {
    return this.getActiveAlerts().filter(alert => alert.type === type);
  }

  /**
   * Get critical alerts
   */
  public getCriticalAlerts(): ErrorAlert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === 'critical');
  }

  /**
   * Clear all resolved alerts
   */
  public clearResolvedAlerts(): void {
    const keysToDelete: string[] = [];
    this.alerts.forEach((alert, key) => {
      if (alert.resolved) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.alerts.delete(key));
  }
}

// Export singleton instance
export const errorAlertService = new ErrorAlertService();

/**
 * Helper function to log reminder sending error
 */
export function logReminderError(
  patientName: string,
  patientPhone: string,
  error: Error,
  details?: Record<string, any>
): ErrorAlert {
  return errorAlertService.createAlert(
    'reminder_failed',
    'high',
    `Falha ao enviar recordatório para ${patientName}`,
    {
      patientName,
      patientPhone,
      errorMessage: error.message,
      errorStack: error.stack,
      ...details,
    }
  );
}

/**
 * Helper function to log webhook error
 */
export function logWebhookError(
  webhookUrl: string,
  error: Error,
  details?: Record<string, any>
): ErrorAlert {
  return errorAlertService.createAlert(
    'webhook_failed',
    'critical',
    `Falha na chamada do webhook: ${webhookUrl}`,
    {
      webhookUrl,
      errorMessage: error.message,
      errorStack: error.stack,
      ...details,
    }
  );
}

/**
 * Helper function to log session error
 */
export function logSessionError(
  sessionName: string,
  error: Error,
  details?: Record<string, any>
): ErrorAlert {
  return errorAlertService.createAlert(
    'session_error',
    'high',
    `Erro de sessão: ${sessionName}`,
    {
      sessionName,
      errorMessage: error.message,
      errorStack: error.stack,
      ...details,
    }
  );
}

/**
 * Helper function to log network error
 */
export function logNetworkError(
  endpoint: string,
  error: Error,
  details?: Record<string, any>
): ErrorAlert {
  return errorAlertService.createAlert(
    'network_error',
    'medium',
    `Erro de conexão: ${endpoint}`,
    {
      endpoint,
      errorMessage: error.message,
      errorStack: error.stack,
      ...details,
    }
  );
}
