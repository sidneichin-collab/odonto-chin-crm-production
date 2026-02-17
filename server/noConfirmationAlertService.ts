// @ts-nocheck - Type issues to be fixed
/**
 * No-Confirmation Alert Service
 * 
 * Este servicio envía alertas a las secretarias cuando:
 * 1. Un paciente NO confirma su cita
 * 2. Falta 1 hora para la cita y el paciente no confirmó
 * 3. Falta 30 minutos para la cita y el paciente no confirmó
 */

import { notifyOwner } from "./_core/notification";
import { db } from "./db";
import { appointments, patients } from "../drizzle/schema";
import { sql } from "drizzle-orm";

export interface NoConfirmationAlert {
  appointmentId: number;
  patientName: string;
  patientPhone: string;
  appointmentTime: Date;
  minutesUntilAppointment: number;
  severity: 'warning' | 'critical';
}

/**
 * Obtiene todas las citas sin confirmar que están próximas
 */
export async function getUnconfirmedAppointmentsNearTime(): Promise<NoConfirmationAlert[]> {

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

  // Obtener citas sin confirmar que están entre 30 minutos y 1 hora
  const unconfirmedAppointments = await db
    .select({
      id: appointments.id,
      patientName: patients.fullName,
      patientPhone: patients.phone,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status,
      confirmedAt: appointments.confirmedAt,
    })
    .from(appointments)
    .innerJoin(patients, sql`${appointments.patientId} = ${patients.id}`)
    .where(
      sql`
        ${appointments.status} != 'confirmed' 
        AND ${appointments.appointmentDate} >= ${now} 
        AND ${appointments.appointmentDate} <= ${oneHourLater}
      `
    );

  return unconfirmedAppointments.map((apt) => {
    const minutesUntil = Math.floor(
      (apt.appointmentDate.getTime() - now.getTime()) / (1000 * 60)
    );

    return {
      appointmentId: apt.id,
      patientName: (apt.patientName || "Paciente"),
      patientPhone: apt.phone || apt.patientPhone || "N/A",
      appointmentTime: apt.appointmentDate,
      minutesUntilAppointment: minutesUntil,
      severity: minutesUntil <= 30 ? 'critical' : 'warning',
    };
  });
}

/**
 * Envía alerta a las secretarias sobre no-confirmación
 */
export async function sendNoConfirmationAlert(alert: NoConfirmationAlert): Promise<boolean> {
  try {
    const severityLabel = alert.severity === 'critical' ? '🚨 CRÍTICO' : '⚠️ ADVERTENCIA';
    const title = `${severityLabel}: Cita sin confirmar - ${(alert.patientName || "Paciente")}`;

    const content = `
**Paciente:** ${(alert.patientName || "Paciente")}
**Teléfono:** ${alert.phone || alert.patientPhone || "N/A"}
**Hora de cita:** ${alert.appointmentTime.toLocaleTimeString('es-ES', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
**Tiempo restante:** ${alert.minutesUntilAppointment} minutos

**Acción recomendada:**
${
  alert.severity === 'critical'
    ? '🔴 LLAMAR INMEDIATAMENTE AL PACIENTE para confirmar su asistencia'
    : '🟡 Enviar recordatorio final via WhatsApp'
}

**Historial:**
- El paciente NO respondió a los recordatorios anteriores
- Se requiere confirmación urgente
    `;

    // Enviar notificación al propietario (secretaria)
    const result = await notifyOwner({
      title,
      content,
    });

    return result;
  } catch (error) {
    console.error('Error sending no-confirmation alert:', error);
    return false;
  }
}

/**
 * Procesa todas las citas sin confirmar y envía alertas
 */
export async function processNoConfirmationAlerts(): Promise<{
  processed: number;
  alerts_sent: number;
  critical_alerts: number;
}> {
  try {
    const unconfirmedAppointments = await getUnconfirmedAppointmentsNearTime();

    let alertsSent = 0;
    let criticalAlerts = 0;

    for (const alert of unconfirmedAppointments) {
      const sent = await sendNoConfirmationAlert(alert);
      if (sent) {
        alertsSent++;
        if (alert.severity === 'critical') {
          criticalAlerts++;
        }
      }
    }

    return {
      processed: unconfirmedAppointments.length,
      alerts_sent: alertsSent,
      critical_alerts: criticalAlerts,
    };
  } catch (error) {
    console.error('Error processing no-confirmation alerts:', error);
    return {
      processed: 0,
      alerts_sent: 0,
      critical_alerts: 0,
    };
  }
}

/**
 * Scheduler para ejecutar cada 15 minutos
 * Verifica citas sin confirmar y envía alertas
 */
export function startNoConfirmationAlertScheduler() {
  // Ejecutar cada 15 minutos
  const intervalId = setInterval(async () => {
    try {
      console.log('[No-Confirmation Alert Scheduler] Checking for unconfirmed appointments...');
      const result = await processNoConfirmationAlerts();
      
      if (result.alerts_sent > 0) {
        console.log(`[No-Confirmation Alert Scheduler] Sent ${result.alerts_sent} alerts (${result.critical_alerts} critical)`);
      }
    } catch (error) {
      console.error('[No-Confirmation Alert Scheduler] Error:', error);
    }
  }, 15 * 60 * 1000); // 15 minutos

  return intervalId;
}

/**
 * Detiene el scheduler
 */
export function stopNoConfirmationAlertScheduler(intervalId: NodeJS.Timeout) {
  clearInterval(intervalId);
}
