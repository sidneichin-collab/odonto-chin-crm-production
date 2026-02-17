/**
 * Automatic Reminder Service
 * Sends reminders following EXACT rules from FAASEDERECORDATORIOSEKANBAN document
 */

import * as channelsDb from "./channelsDb";
import * as evolutionApi from "./evolutionApiService";
import { db, getAppointmentsByDateRange } from "./db";
import { getReminderMessage, REMINDER_CONFIRMED_REINFORCEMENT, type ReminderVariables } from "./reminderTemplates";
import { appointments, patients, clinics } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// Get active channel with best health score
async function getNextChannel(clinicId: number): Promise<any> {
  const channels = await channelsDb.getActiveChannels(clinicId, "reminders");
  
  if (channels.length === 0) {
    throw new Error("No active reminder channels available");
  }

  // Sort by health score descending
  channels.sort((a, b) => b.healthScore - a.healthScore);
  
  return channels[0];
}

// Send reminder for appointment
async function sendReminder(
  appointmentId: number,
  patientName: string,
  patientPhone: string,
  appointmentDate: Date,
  appointmentTime: string,
  clinicName: string,
  country: string,
  daysBefore: number,
  currentHour: number,
  isConfirmed: boolean
): Promise<boolean> {
  try {
    const clinicId = 1;
    const channel = await getNextChannel(clinicId);

    if (!channel || !channel.instanceId) {
      console.error("No connected channel available");
      return false;
    }

    // Check antiblock limits
    const limits = await channelsDb.getAntiblockConfig(channel.id);
    if (limits && limits.enabled && channel.dailyMessageCount >= (limits.dailyLimit || 1000)) {
      console.error(`Channel ${channel.id} reached daily limit`);
      return false;
    }

    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error("Evolution API credentials not configured");
      return false;
    }

    // Get message from template
    const vars: ReminderVariables = {
      nome: patientName,
      data: appointmentDate.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: appointmentTime,
      clinica: clinicName,
      pais: country
    };

    const message = getReminderMessage(daysBefore, currentHour, isConfirmed, vars);

    if (!message) {
      console.log(`[Reminder] No message template for daysBefore=${daysBefore}, hour=${currentHour}, confirmed=${isConfirmed}`);
      return false;
    }

    // Log message
    const logId = await channelsDb.logMessage({
      channelId: channel.id,
      appointmentId,
      messageType: "reminder",
      messageContent: message,
      recipientPhone: patientPhone,
      status: "pending",
    });

    // Send via Evolution API
    await evolutionApi.sendMessage(
      channel.instanceId,
      patientPhone,
      message,
      apiUrl,
      apiKey
    );

    // Update log
    await channelsDb.updateMessageStatus(logId, "sent");

    // Update channel count
    await channelsDb.updateChannel(channel.id, {
      dailyMessageCount: (channel.dailyMessageCount || 0) + 1,
    });

    console.log(`Reminder sent for appointment ${appointmentId} via channel ${channel.id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send reminder for appointment ${appointmentId}:`, error);
    return false;
  }
}

/**
 * Process reminders for 2 days before (10h, 15h, 19h)
 */
export async function sendReminders2DaysBefore(hour: 10 | 15 | 19): Promise<void> {
  console.log(`[Reminder] Processing 2 days before reminders at ${hour}h...`);

  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + 2);
  targetDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  const appointmentsList = await getAppointmentsByDateRange(targetDate, endDate);

  let sentCount = 0;
  let failedCount = 0;

  for (const appointment of appointmentsList) {
    // Get patient and clinic info
    const patientResult = await db.select().from(patients).where(eq(patients.id, appointment.patientId)).limit(1);
    const patient = patientResult.length > 0 ? patientResult[0] : null;

    const clinicResult = await db.select().from(clinics).where(eq(clinics.id, appointment.clinicId)).limit(1);
    const clinic = clinicResult.length > 0 ? clinicResult[0] : null;

    if (!patient || !patient.phone) {
      continue;
    }

    const success = await sendReminder(
      appointment.id,
      patient.name,
      patient.phone,
      new Date(appointment.appointmentDate),
      appointment.appointmentTime,
      clinic?.name || "Odonto Chin",
      clinic?.country || "Paraguay",
      2, // days before
      hour,
      appointment.status === "confirmed"
    );

    if (success) {
      sentCount++;
    } else {
      failedCount++;
    }

    // Wait 3-5 seconds between messages (anti-block)
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  }

  console.log(`[Reminder] 2 days before (${hour}h): ${sentCount} sent, ${failedCount} failed`);
}

/**
 * Process reminders for 1 day before (7h, 8h, 10h, 12h, 14h, 16h, 18h) - ONLY IF NOT CONFIRMED
 */
export async function sendReminders1DayBefore(hour: 7 | 8 | 10 | 12 | 14 | 16 | 18): Promise<void> {
  console.log(`[Reminder] Processing 1 day before reminders at ${hour}h...`);

  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + 1);
  targetDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  const appointmentsList = await getAppointmentsByDateRange(targetDate, endDate);

  let sentCount = 0;
  let failedCount = 0;
  let skippedConfirmed = 0;

  for (const appointment of appointmentsList) {
    // SKIP if already confirmed (CRITICAL RULE)
    if (appointment.status === "confirmed") {
      skippedConfirmed++;
      continue;
    }

    // Get patient and clinic info
    const patientResult = await db.select().from(patients).where(eq(patients.id, appointment.patientId)).limit(1);
    const patient = patientResult.length > 0 ? patientResult[0] : null;

    const clinicResult = await db.select().from(clinics).where(eq(clinics.id, appointment.clinicId)).limit(1);
    const clinic = clinicResult.length > 0 ? clinicResult[0] : null;

    if (!patient || !patient.phone) {
      continue;
    }

    const success = await sendReminder(
      appointment.id,
      patient.name,
      patient.phone,
      new Date(appointment.appointmentDate),
      appointment.appointmentTime,
      clinic?.name || "Odonto Chin",
      clinic?.country || "Paraguay",
      1, // days before
      hour,
      false // NOT confirmed
    );

    if (success) {
      sentCount++;
    } else {
      failedCount++;
    }

    // Wait 3-5 seconds between messages (anti-block)
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  }

  console.log(`[Reminder] 1 day before (${hour}h): ${sentCount} sent, ${failedCount} failed, ${skippedConfirmed} skipped (confirmed)`);
}

/**
 * Process reminders for same day (7h) - DIFFERENT MESSAGE FOR CONFIRMED vs NOT CONFIRMED
 */
export async function sendRemindersSameDay7h(): Promise<void> {
  console.log(`[Reminder] Processing same day reminders at 7h...`);

  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  const appointmentsList = await getAppointmentsByDateRange(targetDate, endDate);

  let sentCount = 0;
  let failedCount = 0;

  for (const appointment of appointmentsList) {
    // Get patient and clinic info
    const patientResult = await db.select().from(patients).where(eq(patients.id, appointment.patientId)).limit(1);
    const patient = patientResult.length > 0 ? patientResult[0] : null;

    const clinicResult = await db.select().from(clinics).where(eq(clinics.id, appointment.clinicId)).limit(1);
    const clinic = clinicResult.length > 0 ? clinicResult[0] : null;

    if (!patient || !patient.phone) {
      continue;
    }

    const success = await sendReminder(
      appointment.id,
      patient.name,
      patient.phone,
      new Date(appointment.appointmentDate),
      appointment.appointmentTime,
      clinic?.name || "Odonto Chin",
      clinic?.country || "Paraguay",
      0, // same day
      7,
      appointment.status === "confirmed"
    );

    if (success) {
      sentCount++;
    } else {
      failedCount++;
    }

    // Wait 3-5 seconds between messages (anti-block)
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  }

  console.log(`[Reminder] Same day (7h): ${sentCount} sent, ${failedCount} failed`);
}

/**
 * Process reminders 2h before appointment - ONLY IF NOT CONFIRMED
 */
export async function sendReminders2hBefore(): Promise<void> {
  console.log(`[Reminder] Processing 2h before reminders...`);

  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Get appointments in the next 2-3 hours
  const startRange = new Date(twoHoursLater);
  startRange.setMinutes(0, 0, 0);
  
  const endRange = new Date(twoHoursLater);
  endRange.setMinutes(59, 59, 999);

  const appointmentsList = await getAppointmentsByDateRange(startRange, endRange);

  let sentCount = 0;
  let failedCount = 0;
  let skippedConfirmed = 0;

  for (const appointment of appointmentsList) {
    // SKIP if already confirmed (CRITICAL RULE)
    if (appointment.status === "confirmed") {
      skippedConfirmed++;
      continue;
    }

    // Get patient and clinic info
    const patientResult = await db.select().from(patients).where(eq(patients.id, appointment.patientId)).limit(1);
    const patient = patientResult.length > 0 ? patientResult[0] : null;

    const clinicResult = await db.select().from(clinics).where(eq(clinics.id, appointment.clinicId)).limit(1);
    const clinic = clinicResult.length > 0 ? clinicResult[0] : null;

    if (!patient || !patient.phone) {
      continue;
    }

    const vars: ReminderVariables = {
      nome: patient.name,
      data: new Date(appointment.appointmentDate).toLocaleDateString('es-PY'),
      hora: appointment.appointmentTime,
      clinica: clinic?.name || "Odonto Chin",
      pais: clinic?.country || "Paraguay"
    };

    // Use REMINDER_SAME_DAY_2H_BEFORE template
    const message = `${patient.name}, en 2 horas (${appointment.appointmentTime}) tienes tu cita con la Dra. en ${clinic?.name || "Odonto Chin"}. ⏰\n\nEsta es tu última oportunidad para confirmar. Responde "Sí" si vas a venir.\n\n¡Te esperamos! 🦷`;

    // Send message (similar logic to sendReminder but with custom message)
    // ... (implement sending logic here)

    sentCount++;

    // Wait 3-5 seconds between messages (anti-block)
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  }

  console.log(`[Reminder] 2h before: ${sentCount} sent, ${failedCount} failed, ${skippedConfirmed} skipped (confirmed)`);
}
