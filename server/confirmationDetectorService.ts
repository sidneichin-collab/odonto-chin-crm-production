/**
 * Confirmation Detector Service
 * Detects patient confirmations and reschedule requests from WhatsApp messages
 */

import { db } from './db';
import { appointments, patients } from '../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
import { processRescheduleWorkflow } from './rescheduleNotificationService';

export interface ConfirmationResult {
  detected: boolean;
  appointmentId?: number;
  movedToConfirmed?: boolean;
}

export interface RescheduleResult {
  detected: boolean;
  appointmentId?: number;
  alertCreated?: boolean;
}

/**
 * Detect confirmation keywords in message
 */
export function detectConfirmation(message: string): ConfirmationResult {
  if (!message || typeof message !== 'string') {
    return { detected: false };
  }

  const text = message.toLowerCase().trim();
  
  // Confirmation patterns (word boundaries for precision)
  const confirmationPatterns = [
    /sí/i,  // "sí" with accent
    /\bsi\b/i,  // "si" without accent
    /\byes\b/i,
    /\bconfirmo\b/i,
    /\bconfirma\b/i,
    /\bconfirmar\b/i,
    /\bok\b/i,
    /\bvale\b/i,
    /\bclaro\b/i,
    /\bseguro\b/i,
    /\bvoy\b/i,
    /\basistire\b/i,
    /\basistir\b/i,
    /\bestare\b/i,
    /\bestar\b/i,
    /\bperfecto\b/i,
    /\bde acuerdo\b/i,
    /\u2705/,  // ✅
    /\ud83d\udc4d/  // 👍
  ];

  for (const pattern of confirmationPatterns) {
    if (pattern.test(text)) {
      return { detected: true };
    }
  }
  
  return { detected: false };
}

/**
 * Detect reschedule request keywords in message
 */
export function detectRescheduleRequest(message: string): RescheduleResult {
  if (!message || typeof message !== 'string') {
    return { detected: false };
  }

  const text = message.toLowerCase().trim();
  
  const reschedulePatterns = [
    /reagendar/i,
    /reagendá/i,
    /reagenda/i,
    /reagendo/i,
    /reagendó/i,
    /reagende/i,
    /reagendé/i,
    /\bcambiar\b/i,
    /\bcambio\b/i,
    /\botro dia\b/i,
    /\botro día\b/i,
    /\bmover\b/i,
    /\bposponer\b/i,
    /\bmodificar\b/i,
    /\bno puedo\b/i,
    /\bno consigo\b/i,
    /\bno voy\b/i,
    /\bno tiene\b/i,
    /\bno podré\b/i,
    /\bno podre\b/i,
    /\bno iré\b/i,
    /\bno ire\b/i,
    /\bpara otro dia\b/i,
    /\bpara otro día\b/i
  ];

  for (const pattern of reschedulePatterns) {
    if (pattern.test(text)) {
      return { detected: true };
    }
  }
  
  return { detected: false };
}

/**
 * Check if message is a confirmation (alias)
 */
export function isConfirmationMessage(message: string): boolean {
  return detectConfirmation(message).detected;
}

/**
 * Check if message is a reschedule request (alias)
 */
export function isRescheduleRequest(message: string): boolean {
  return detectRescheduleRequest(message).detected;
}

/**
 * Process confirmation from patient
 */
export async function processConfirmation(
  phone: string,
  message: string
): Promise<ConfirmationResult> {
  const detection = detectConfirmation(message);
  
  if (!detection.detected) {
    return { detected: false };
  }
  
  console.log(`[ConfirmationDetector] Confirmation detected from ${phone}`);
  
  try {
    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
    
    // Find patient by phone
    const patientResults = await db.select()
      .from(patients)
      .where(
        or(
          eq(patients.phone, phone),
          eq(patients.phone, normalizedPhone),
          eq(patients.phone, `+${normalizedPhone}`)
        )
      )
      .limit(1);
    
    const patient = patientResults[0];
    
    if (!patient) {
      console.log(`[ConfirmationDetector] Patient not found for phone ${phone}`);
      return { detected: true, movedToConfirmed: false };
    }
    
    // Find pending appointment (scheduled or not_confirmed)
    const appointmentResults = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patient.id),
          or(
            eq(appointments.status, 'scheduled'),
            eq(appointments.status, 'not_confirmed')
          )
        )
      )
      .orderBy(appointments.appointmentDate)
      .limit(1);
    
    const appointment = appointmentResults[0];
    
    if (!appointment) {
      console.log(`[ConfirmationDetector] No pending appointment for patient ${patient.id}`);
      return { detected: true, movedToConfirmed: false };
    }
    
    // Update status to confirmed
    await db.update(appointments)
      .set({ 
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, appointment.id));
    
    console.log(`[ConfirmationDetector] ✅ Appointment ${appointment.id} confirmed!`);
    
    return {
      detected: true,
      appointmentId: appointment.id,
      movedToConfirmed: true
    };
  } catch (error) {
    console.error('[ConfirmationDetector] Error processing confirmation:', error);
    return { detected: true, movedToConfirmed: false };
  }
}

/**
 * Process reschedule request from patient
 */
export async function processRescheduleRequest(
  phone: string,
  message: string
): Promise<RescheduleResult> {
  const detection = detectRescheduleRequest(message);
  
  if (!detection.detected) {
    return { detected: false };
  }
  
  console.log(`[ConfirmationDetector] 📅 Reschedule request detected from ${phone}`);
  
  // Process complete reschedule workflow (automatic response + corporate notification + alert)
  try {
    const workflowResult = await processRescheduleWorkflow(phone, message);
    console.log(`[ConfirmationDetector] Reschedule workflow completed:`, workflowResult);
  } catch (workflowError) {
    console.error(`[ConfirmationDetector] Error in reschedule workflow:`, workflowError);
  }
  
  try {
    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
    
    // Find patient
    const patientResults = await db.select()
      .from(patients)
      .where(
        or(
          eq(patients.phone, phone),
          eq(patients.phone, normalizedPhone),
          eq(patients.phone, `+${normalizedPhone}`)
        )
      )
      .limit(1);
    
    const patient = patientResults[0];
    
    if (!patient) {
      console.log(`[ConfirmationDetector] Patient not found for reschedule request`);
      return { detected: true, alertCreated: false };
    }
    
    // Find appointment
    const appointmentResults = await db.select()
      .from(appointments)
      .where(eq(appointments.patientId, patient.id))
      .orderBy(appointments.appointmentDate)
      .limit(1);
    
    const appointment = appointmentResults[0];
    
    if (!appointment) {
      console.log(`[ConfirmationDetector] No appointment found for reschedule`);
      return { detected: true, alertCreated: false };
    }
    
    // Update status to rescheduling_pending
    await db.update(appointments)
      .set({ status: 'rescheduling_pending' })
      .where(eq(appointments.id, appointment.id));
    
    console.log(`[ConfirmationDetector] Appointment ${appointment.id} marked for rescheduling`);
    
    // TODO: Create alert for secretary
    // TODO: Send notification to corporate WhatsApp
    // TODO: Trigger popup with sound
    
    return {
      detected: true,
      appointmentId: appointment.id,
      alertCreated: true
    };
  } catch (error) {
    console.error('[ConfirmationDetector] Error processing reschedule:', error);
    return { detected: true, alertCreated: false };
  }
}

export interface ProcessMessagesResult {
  confirmationsDetected: number;
  reschedulesDetected: number;
  messagesProcessed: number;
}

/**
 * Process all incoming messages
 */
export async function processAllIncomingMessages(): Promise<ProcessMessagesResult> {
  console.log('[ConfirmationDetector] Processing all incoming messages');
  
  // TODO: Implement
  // - Fetch unprocessed WhatsApp messages from database
  // - Check each for confirmation or reschedule keywords
  // - Process accordingly
  
  return {
    confirmationsDetected: 0,
    reschedulesDetected: 0,
    messagesProcessed: 0
  };
}
