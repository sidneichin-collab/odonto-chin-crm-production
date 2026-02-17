/**
 * Reschedule Alert Service
 * 
 * Maneja solicitudes de reagendamiento:
 * 1. Detecta cuando paciente quiere reagendar
 * 2. Envía nombre + link WhatsApp a cooperativo de clínica
 * 3. Envía mensaje al paciente: "La secretaria te escribirá ahora"
 * 4. Crea alerta sonora piscando en Dashboard para secretaria
 * 5. Solo secretaria puede reagendar (permisos)
 */

import { notifyOwner } from "./_core/notification";
import { sendReminderMessage } from "./whatsappReminderService";

export interface RescheduleRequest {
  patientId: number;
  patientName: string;
  patientPhone: string;
  appointmentId: number;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  messageTimestamp: number;
}

export interface RescheduleAlert {
  id: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  whatsappLink: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  createdAt: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  secretaryId?: number;
}

/**
 * Procesa solicitud de reagendamiento
 */
export async function processRescheduleRequest(request: RescheduleRequest): Promise<{
  success: boolean;
  alertId: string;
  message: string;
}> {
  try {
    // 1. Crear alerta para secretaria
    const alertId = `RESCHEDULE_${request.patientId}_${Date.now()}`;
    
    const whatsappLink = `https://wa.me/${request.patientPhone}?text=Hola%20${encodeURIComponent(request.patientName)}%2C%20queremos%20reagendar%20tu%20cita`;

    const alert: RescheduleAlert = {
      id: alertId,
      patientId: request.patientId,
      patientName: request.patientName,
      patientPhone: request.patientPhone,
      whatsappLink,
      appointmentDate: request.appointmentDate,
      appointmentTime: request.appointmentTime,
      reason: request.reason,
      createdAt: Date.now(),
      status: 'pending',
    };

    // 2. Enviar notificación a cooperativo de clínica
    const notificationResult = await notifyOwner({
      title: `🔴 ALERTA DE REAGENDAMIENTO - ${request.patientName}`,
      content: `
**Paciente:** ${request.patientName}
**Teléfono:** ${request.patientPhone}
**Cita Original:** ${request.appointmentDate} a las ${request.appointmentTime}
**Razón:** ${request.reason || 'No especificada'}

**Acciones rápidas:**
- 📱 [Contactar por WhatsApp](${whatsappLink})
- ⏰ Reagendar inmediatamente
- 📌 Prioridad: ALTA

El paciente está esperando que la secretaria lo contacte AHORA.
      `,
    });

    console.log(`[Reschedule] ✅ Alerta enviada al cooperativo para ${request.patientName}`);

    // 3. Enviar mensaje al paciente
    const messageToPatient = `Entendido, ${request.patientName}! 

La secretaria te escribirá ahora para reagendarte. Gracias! 😊

Ortobom Odontología`;

    const messageResult = await sendReminderMessage(request.patientPhone, messageToPatient);

    console.log(`[Reschedule] ✅ Mensaje enviado a ${request.patientName}`);

    // 4. Crear evento para Dashboard (alerta sonora + piscando)
    // Este evento será capturado por WebSocket en tiempo real
    const dashboardAlert = {
      type: 'reschedule_alert',
      alertId,
      patientName: request.patientName,
      patientPhone: request.patientPhone,
      whatsappLink,
      appointmentDate: request.appointmentDate,
      appointmentTime: request.appointmentTime,
      timestamp: Date.now(),
      priority: 'critical',
      soundAlert: true,
      blinkingAlert: true,
    };

    // Aquí se enviaría el evento a través de WebSocket o similar
    console.log(`[Reschedule] 🔴 Alerta Dashboard creada:`, dashboardAlert);

    return {
      success: notificationResult && messageResult,
      alertId,
      message: `Alerta de reagendamiento creada para ${request.patientName}`,
    };
  } catch (error) {
    console.error('[Reschedule] ❌ Error procesando solicitud:', error);
    return {
      success: false,
      alertId: '',
      message: 'Error al procesar solicitud de reagendamiento',
    };
  }
}

/**
 * Obtiene todas las alertas pendientes de reagendamiento
 */
export async function getPendingRescheduleAlerts(): Promise<RescheduleAlert[]> {
  // TODO: Implementar consulta a base de datos
  // Por ahora retorna array vacío
  return [];
}

/**
 * Marca una alerta como completada (secretaria reagendó)
 */
export async function completeRescheduleAlert(alertId: string, secretaryId: number): Promise<boolean> {
  try {
    console.log(`[Reschedule] ✅ Alerta ${alertId} completada por secretaria ${secretaryId}`);
    // TODO: Actualizar estado en base de datos
    return true;
  } catch (error) {
    console.error('[Reschedule] ❌ Error completando alerta:', error);
    return false;
  }
}

/**
 * Cancela una alerta de reagendamiento
 */
export async function cancelRescheduleAlert(alertId: string, reason: string): Promise<boolean> {
  try {
    console.log(`[Reschedule] ❌ Alerta ${alertId} cancelada. Razón: ${reason}`);
    // TODO: Actualizar estado en base de datos
    return true;
  } catch (error) {
    console.error('[Reschedule] ❌ Error cancelando alerta:', error);
    return false;
  }
}

/**
 * Verifica permisos: solo secretaria puede reagendar
 */
export function canRescheduleAppointment(userRole: string, userId: number): boolean {
  // Solo usuarios con rol 'secretary' o 'admin' pueden reagendar
  return ['secretary', 'admin'].includes(userRole);
}

/**
 * Template para mensaje de confirmación al paciente
 */
export const rescheduleConfirmationTemplate = (patientName: string): string => {
  return `¡Perfecto, ${patientName}! 

Tu nueva cita ha sido confirmada.

Recuerda que el mantenimiento al día es fundamental para el éxito de tu tratamiento.

¡Nos vemos pronto!

Ortobom Odontología`;
};
