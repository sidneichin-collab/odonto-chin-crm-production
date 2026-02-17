/**
 * Reschedule Notification Service
 * Handles the complete reschedule workflow:
 * 1. Send automatic response to patient
 * 2. Notify corporate WhatsApp
 * 3. Create alert for secretary dashboard
 */

import { db } from './db';
import { appointments, patients, clinics, rescheduleAlerts } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendMessage } from './evolutionApiService';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://95.111.240.243:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'OdontoChinSecretKey2026';
const INSTANCE_NAME = 'odonto-chin-instance'; // Default instance name

export interface RescheduleNotificationResult {
  success: boolean;
  patientResponseSent: boolean;
  corporateNotificationSent: boolean;
  alertCreated: boolean;
  error?: string;
}

/**
 * Process complete reschedule workflow
 */
export async function processRescheduleWorkflow(
  patientPhone: string,
  patientMessage: string
): Promise<RescheduleNotificationResult> {
  try {
    console.log(`[RescheduleNotification] Processing reschedule for ${patientPhone}`);
    
    // 1. Find patient
    const normalizedPhone = patientPhone.replace(/\D/g, '').replace(/^0+/, '');
    
    const patientResults = await db.select()
      .from(patients)
      .where(eq(patients.phone, patientPhone))
      .limit(1);
    
    const patient = patientResults[0];
    
    if (!patient) {
      console.log(`[RescheduleNotification] Patient not found`);
      return {
        success: false,
        patientResponseSent: false,
        corporateNotificationSent: false,
        alertCreated: false,
        error: 'Patient not found'
      };
    }
    
    // 2. Find appointment
    const appointmentResults = await db.select()
      .from(appointments)
      .where(eq(appointments.patientId, patient.id))
      .orderBy(appointments.appointmentDate)
      .limit(1);
    
    const appointment = appointmentResults[0];
    
    if (!appointment) {
      console.log(`[RescheduleNotification] No appointment found`);
      return {
        success: false,
        patientResponseSent: false,
        corporateNotificationSent: false,
        alertCreated: false,
        error: 'No appointment found'
      };
    }
    
    // 3. Get clinic info
    const clinicResults = await db.select()
      .from(clinics)
      .where(eq(clinics.id, appointment.clinicId))
      .limit(1);
    
    const clinic = clinicResults[0];
    
    if (!clinic) {
      console.log(`[RescheduleNotification] Clinic not found`);
      return {
        success: false,
        patientResponseSent: false,
        corporateNotificationSent: false,
        alertCreated: false,
        error: 'Clinic not found'
      };
    }
    
    // 4. Send automatic response to patient
    const patientResponseMessage = `A secretaria te escribe ahora para reagendarte. Gracias ${patient.name}! 😊`;
    
    let patientResponseSent = false;
    try {
      await sendMessage(INSTANCE_NAME, patientPhone, patientResponseMessage, EVOLUTION_API_URL, EVOLUTION_API_KEY);
      patientResponseSent = true;
      console.log(`[RescheduleNotification] ✅ Patient response sent`);
    } catch (error) {
      console.error(`[RescheduleNotification] ❌ Failed to send patient response:`, error);
    }
    
    // 5. Send notification to corporate WhatsApp
    const whatsappLink = `https://wa.me/${normalizedPhone}`;
    const corporateMessage = `🔔 *SOLICITUD DE REAGENDAMIENTO*

*Paciente:* ${patient.name}
*Teléfono:* ${patientPhone}
*Link WhatsApp:* ${whatsappLink}

*Cita actual:*
📅 ${appointment.appointmentDate}
🕐 ${appointment.appointmentTime}

*Clínica:* ${clinic.name}

*Mensaje del paciente:*
"${patientMessage}"

⚠️ *ACCIÓN REQUERIDA:* La secretaria debe contactar al paciente para reagendar.`;
    
    let corporateNotificationSent = false;
    const corporatePhone = clinic.phone; // Use clinic phone as corporate contact
    if (corporatePhone) {
      try {
        await sendMessage(INSTANCE_NAME, corporatePhone, corporateMessage, EVOLUTION_API_URL, EVOLUTION_API_KEY);
        corporateNotificationSent = true;
        console.log(`[RescheduleNotification] ✅ Corporate notification sent`);
      } catch (error) {
        console.error(`[RescheduleNotification] ❌ Failed to send corporate notification:`, error);
      }
    } else {
      console.log(`[RescheduleNotification] ⚠️ No corporate WhatsApp configured for clinic`);
    }
    
    // 6. Create alert for secretary dashboard
    let alertCreated = false;
    try {
      await db.insert(rescheduleAlerts).values({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patientPhone,
        message: patientMessage,
        viewed: 0,
        resolved: 0,
        createdAt: new Date().toISOString()
      });
      alertCreated = true;
      console.log(`[RescheduleNotification] ✅ Alert created for dashboard`);
    } catch (error) {
      console.error(`[RescheduleNotification] ❌ Failed to create alert:`, error);
    }
    
    // 7. Update appointment status
    await db.update(appointments)
      .set({ status: 'rescheduling_pending' })
      .where(eq(appointments.id, appointment.id));
    
    return {
      success: true,
      patientResponseSent,
      corporateNotificationSent,
      alertCreated
    };
    
  } catch (error) {
    console.error('[RescheduleNotification] Error:', error);
    return {
      success: false,
      patientResponseSent: false,
      corporateNotificationSent: false,
      alertCreated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get pending reschedule alerts for a clinic
 */
export async function getPendingRescheduleAlerts(clinicId: number) {
  try {
    const alerts = await db.select()
      .from(rescheduleAlerts)
      .where(eq(rescheduleAlerts.viewed, 0))
      .orderBy(rescheduleAlerts.createdAt);
    
    return alerts;
  } catch (error) {
    console.error('[RescheduleNotification] Error getting alerts:', error);
    return [];
  }
}

/**
 * Mark reschedule alert as viewed
 */
export async function markAlertAsViewed(alertId: number) {
  try {
    await db.update(rescheduleAlerts)
      .set({ 
        viewed: 1,
        viewedAt: new Date().toISOString()
      })
      .where(eq(rescheduleAlerts.id, alertId));
    
    return true;
  } catch (error) {
    console.error('[RescheduleNotification] Error marking alert as viewed:', error);
    return false;
  }
}

/**
 * Mark reschedule alert as completed
 */
export async function markAlertAsCompleted(alertId: number) {
  try {
    await db.update(rescheduleAlerts)
      .set({ 
        resolved: 1,
        resolvedAt: new Date().toISOString()
      })
      .where(eq(rescheduleAlerts.id, alertId));
    
    return true;
  } catch (error) {
    console.error('[RescheduleNotification] Error marking alert as completed:', error);
    return false;
  }
}
