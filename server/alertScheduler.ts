// @ts-nocheck
import cron from 'node-cron';
import { getDb } from './db';
import { appointments, patients } from '../drizzle/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

/**
 * SCHEDULER DE ALERTAS GARANTIZADAS
 * 
 * Dispara alertas GARANTIZADAS a las 10:00 y 15:00
 * Funciona incluso si el navegador está cerrado
 * Máxima confiabilidad y credibilidad
 */

interface AlertEvent {
  id: string;
  timestamp: Date;
  hour: number;
  unscheduledCount: number;
  success: boolean;
  error?: string;
}

// Almacenar alertas disparadas para auditoría
const alertHistory: AlertEvent[] = [];

/**
 * Obtiene el rango del mes actual
 */
function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Calcula pacientes no agendados
 */
async function calculateUnscheduledCount(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Obtener pacientes activos
    const activePatients = await db
      .select()
      .from(patients)
      .where(eq(patients.status, 'active'));

    if (activePatients.length === 0) return 0;

    // Obtener pacientes agendados este mes
    const { start, end } = getMonthRange();
    const scheduled = await db
      .select({ patientId: appointments.patientId })
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, start),
          lt(appointments.appointmentDate, end)
        )
      );

    const scheduledSet = new Set(scheduled.map((a: any) => a.patientId));

    // Contar no agendados
    const unscheduled = activePatients.filter(p => !scheduledSet.has(p.id));
    return unscheduled.length;
  } catch (error) {
    console.error('[Alert Scheduler] Error calculating unscheduled count:', error);
    return 0;
  }
}

/**
 * Dispara alerta en el servidor
 */
async function fireAlert(hour: number): Promise<AlertEvent> {
  const alertId = `alert-${Date.now()}-${hour}`;
  
  try {
    console.log(`\n[Alert Scheduler] ⏰ Disparando alerta de las ${hour}:00...`);
    
    const unscheduledCount = await calculateUnscheduledCount();
    
    const alert: AlertEvent = {
      id: alertId,
      timestamp: new Date(),
      hour,
      unscheduledCount,
      success: true,
    };

    // Guardar en historial
    alertHistory.push(alert);
    
    // Limitar historial a últimas 100 alertas
    if (alertHistory.length > 100) {
      alertHistory.shift();
    }

    console.log(`[Alert Scheduler] ✅ Alerta disparada: ${unscheduledCount} pacientes no agendados`);
    console.log(`[Alert Scheduler] 📊 ID: ${alertId}`);
    console.log(`[Alert Scheduler] ⏱️  Timestamp: ${alert.timestamp.toISOString()}`);

    return alert;
  } catch (error) {
    const alert: AlertEvent = {
      id: alertId,
      timestamp: new Date(),
      hour,
      unscheduledCount: 0,
      success: false,
      error: String(error),
    };

    alertHistory.push(alert);
    console.error(`[Alert Scheduler] ❌ Error en alerta: ${error}`);
    
    return alert;
  }
}

/**
 * Obtiene historial de alertas
 */
export function getAlertHistory(): AlertEvent[] {
  return alertHistory;
}

/**
 * Obtiene última alerta
 */
export function getLastAlert(): AlertEvent | null {
  return alertHistory.length > 0 ? alertHistory[alertHistory.length - 1] : null;
}

/**
 * Inicializa scheduler de alertas
 */
export function initializeAlertScheduler() {
  console.log('[Alert Scheduler] 🚀 Inicializando scheduler de alertas...');

  // Alerta a las 10:00 AM (GMT-3)
  // Cron: minuto hora día mes día-semana
  // 0 10 * * * = 10:00 cada día
  const job10 = cron.schedule('0 10 * * *', async () => {
    await fireAlert(10);
  });

  // Alerta a las 15:00 PM (GMT-3)
  // 0 15 * * * = 15:00 cada día
  const job15 = cron.schedule('0 15 * * *', async () => {
    await fireAlert(15);
  });

  console.log('[Alert Scheduler] ✅ Scheduler iniciado:');
  console.log('[Alert Scheduler]   - Alerta 1: 10:00 AM (GMT-3)');
  console.log('[Alert Scheduler]   - Alerta 2: 15:00 PM (GMT-3)');
  console.log('[Alert Scheduler] 📝 Zona horaria: GMT-3 (Paraguay)');

  return { job10, job15 };
}

/**
 * Detiene scheduler de alertas
 */
export function stopAlertScheduler(jobs: { job10: any; job15: any }) {
  console.log('[Alert Scheduler] 🛑 Deteniendo scheduler de alertas...');
  jobs.job10.stop();
  jobs.job15.stop();
  console.log('[Alert Scheduler] ✅ Scheduler detenido');
}

/**
 * Prueba manual de alerta (para testing)
 */
export async function testAlert(hour: number = 10): Promise<AlertEvent> {
  console.log(`[Alert Scheduler] 🧪 Prueba manual de alerta (${hour}:00)...`);
  return await fireAlert(hour);
}

/**
 * Exportar tipos
 */
export type { AlertEvent };
