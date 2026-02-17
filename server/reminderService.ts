// @ts-nocheck - Legacy code with type issues
import cron from "node-cron";
import { getDb } from "./db";
import { appointments, patients, reminderLogs } from "../drizzle/schema";
import { and, eq, gte, lte, or, isNull } from "drizzle-orm";
// WhatsApp integration now uses Evolution API via evolutionApiService
// import { sendWhatsAppMessage, isWhatsAppConnected } from "./whatsappService";
import { sendAppointmentReminderEmail } from "./emailService";
import { sendWhatsAppViaN8n } from "./n8nWhatsAppService";

const CLINIC_ID = "default"; // TODO: Make this dynamic per clinic
const MAX_REMINDER_ATTEMPTS = 5;
const RETRY_DELAY_HOURS = 3;

// TEST MODE: Send reminders every 1 hour today after manual trigger
const TEST_MODE_ENABLED = true;
const TEST_MODE_INTERVAL_MINUTES = 60; // 1 hour

interface ReminderSchedule {
  daysBeforeAppointment: number;
  hours: number[];
}

// Reminder schedule configuration
// Estratégia diferenciada: agressiva para não confirmados, suave para confirmados
const REMINDER_SCHEDULES_NOT_CONFIRMED: ReminderSchedule[] = [
  {
    daysBeforeAppointment: 2,
    hours: [10, 15, 19], // 2 dias antes: 10h, 15h, 19h
  },
  {
    daysBeforeAppointment: 1,
    hours: [6.5, 9, 11, 13, 15, 17, 19, 21], // 1 dia antes: 6h30, depois a cada 2h a partir das 9h
  },
  {
    daysBeforeAppointment: 0,
    hours: [7, 9, 11, 13, 15, 17, 19], // Dia da consulta: continua a cada 2h
  },
];

const REMINDER_SCHEDULES_CONFIRMED: ReminderSchedule[] = [
  {
    daysBeforeAppointment: 2,
    hours: [10], // 2 dias antes: apenas 1 recordatório
  },
  {
    daysBeforeAppointment: 1,
    hours: [10], // 1 dia antes: lembrete agradável
  },
  {
    daysBeforeAppointment: 0,
    hours: [7], // Dia da consulta: lembrete às 7h
  },
];

/**
 * Generate WhatsApp reminder message for NOT CONFIRMED patients (insistent)
 */
function generateReminderMessageNotConfirmed(
  patientName: string,
  appointmentDate: Date,
  appointmentType: string,
  daysBeforeAppointment: number
): string {
  const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const formattedTime = appointmentDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const typeText = appointmentType === "orthodontic_treatment" ? "Ortodontia" : appointmentType === "general_clinic" ? "Clínico Geral" : "Primeira Consulta";

  if (daysBeforeAppointment === 2) {
    return `🦷 *ODONTO CHIN - Confirmação de Consulta*

Olá *${patientName}*! 👋

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${formattedTime}
🔧 *Tipo:* ${typeText}

⚠️ *IMPORTANTE:* Precisamos da sua confirmação!

Por favor, responda:
✅ *SIM* - para confirmar
❌ *NÃO* - para cancelar

_Se não recebermos sua confirmação, continuaremos enviando lembretes._

Aguardamos sua resposta! 😊`;
  } else if (daysBeforeAppointment === 1) {
    return `🦷 *ODONTO CHIN - URGENTE: Confirme sua Consulta*

Olá *${patientName}*! 👋

⏰ *SUA CONSULTA É AMANHÃ!*

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${formattedTime}
🔧 *Tipo:* ${typeText}

⚠️ *AINDA NÃO RECEBEMOS SUA CONFIRMAÇÃO!*

Por favor, responda AGORA:
✅ *SIM* - para confirmar
❌ *NÃO* - para cancelar

_Precisamos saber se você virá para organizar nossa agenda._

Aguardamos urgentemente! 🙏`;
  } else {
    return `🦷 *ODONTO CHIN - Sua Consulta é HOJE!*

Olá *${patientName}*! 👋

⏰ *SUA CONSULTA É HOJE!*

🕐 *Horário:* ${formattedTime}
🔧 *Tipo:* ${typeText}

⚠️ *VOCÊ AINDA NÃO CONFIRMOU!*

Por favor, confirme AGORA:
✅ *SIM* - estou a caminho
❌ *NÃO* - não poderei ir

Estamos aguardando você! 🦷`;
  }
}

/**
 * Generate WhatsApp reminder message for CONFIRMED patients (friendly)
 */
function generateReminderMessageConfirmed(
  patientName: string,
  appointmentDate: Date,
  appointmentType: string,
  daysBeforeAppointment: number
): string {
  const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const formattedTime = appointmentDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const typeText = appointmentType === "orthodontic_treatment" ? "Ortodontia" : appointmentType === "general_clinic" ? "Clínico Geral" : "Primeira Consulta";

  if (daysBeforeAppointment === 2) {
    return `🦷 *ODONTO CHIN - Consulta Confirmada!*

Olá *${patientName}*! 👋

Obrigado por confirmar sua consulta! ✅

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${formattedTime}
🔧 *Tipo:* ${typeText}

Estamos te esperando! Se houver qualquer imprevisto, por favor nos avise com antecedência.

Até breve! 😊🦷`;
  } else if (daysBeforeAppointment === 1) {
    return `🦷 *ODONTO CHIN - Lembrete Agradável*

Olá *${patientName}*! 👋

⏰ *Sua consulta é amanhã!*

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${formattedTime}
🔧 *Tipo:* ${typeText}

Já estamos preparados para recebê-lo(a)! ✨

Caso tenha alguma dúvida, estamos à disposição.

Até amanhã! 😊🦷`;
  } else {
    return `🦷 *ODONTO CHIN - Sua Consulta é Hoje!*

Bom dia, *${patientName}*! ☀️

⏰ *Lembrete: Sua consulta é hoje!*

🕐 *Horário:* ${formattedTime}
🔧 *Tipo:* ${typeText}

Estamos ansiosos para recebê-lo(a)! 😊

Nos vemos em breve! 🦷✨`;
  }
}

/**
 * Send reminder via WhatsApp and/or Email
 */
async function sendReminder(
  appointmentId: number,
  patientName: string,
  patientPhone: string | null,
  patientEmail: string | null,
  appointmentDate: Date,
  appointmentType: string,
  isConfirmed: boolean,
  daysBeforeAppointment: number,
  mediaUrl?: string,
  mediaType?: "image" | "document" | "video" | "audio",
  fileName?: string
): Promise<{
  whatsappSent: boolean;
  emailSent: boolean;
  error?: string;
}> {
  let whatsappSent = false;
  let emailSent = false;
  let lastError: string | undefined;

  // Try WhatsApp first via n8n + Evolution API
  if (patientPhone) {
    try {
      // Choose message template based on confirmation status
      const message = isConfirmed 
        ? generateReminderMessageConfirmed(patientName, appointmentDate, appointmentType, daysBeforeAppointment)
        : generateReminderMessageNotConfirmed(patientName, appointmentDate, appointmentType, daysBeforeAppointment);
      
      const result = await sendWhatsAppViaN8n({
        sessionId: "canal-recordatorios",
        phone: patientPhone,
        message,
        mediaUrl,
        mediaType,
        fileName,
      });
      
      if (result.success) {
        whatsappSent = true;
        console.log(`[Reminder] WhatsApp sent via n8n for appointment ${appointmentId}`);
      } else {
        lastError = result.error;
        console.error(`[Reminder] WhatsApp via n8n failed for appointment ${appointmentId}: ${result.error}`);
      }

      // Anti-blocking delay (30-90 seconds between messages)
      const delay = Math.floor(Math.random() * (90000 - 30000 + 1)) + 30000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error: any) {
      lastError = error.messageText;
      console.error(`[Reminder] WhatsApp via n8n error for appointment ${appointmentId}:`, error);
    }
  }

  // Fallback to Email if WhatsApp failed or not available
  if (!whatsappSent && patientEmail) {
    const result = await sendAppointmentReminderEmail(
      CLINIC_ID,
      patientEmail,
      patientName,
      appointmentDate.toISOString().split('T')[0], // Convert Date to string (YYYY-MM-DD)
      appointmentType
    );

    if (result.success) {
      emailSent = true;
      console.log(`[Reminder] Email sent for appointment ${appointmentId}`);
    } else {
      lastError = result.error;
      console.error(`[Reminder] Email failed for appointment ${appointmentId}:`, result.error);
    }
  }

  return {
    whatsappSent,
    emailSent,
    error: lastError,
  };
}

/**
 * Log reminder attempt
 */
async function logReminderAttempt(
  appointmentId: number,
  channel: "whatsapp" | "email",
  status: "sent" | "failed",
  message: string,
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(reminderLogs).values({
      appointmentId,
      sentAt: new Date(),
      channel,
      message,
      status,
      errorMessage: errorMessage || null,
    });
  } catch (error) {
    console.error(`[Reminder] Error logging attempt:`, error);
  }
}

/**
 * Update appointment reminder status
 */
async function updateAppointmentReminderStatus(
  appointmentId: number,
  reminderAttempts: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(appointments)
      .set({
        reminderAttempts,
        lastReminderAt: new Date(),
        reminderSent: true,
        reminderSentAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));
  } catch (error) {
    console.error(`[Reminder] Error updating appointment status:`, error);
  }
}

/**
 * Process reminders for a specific schedule
 */
async function processReminders(
  daysBeforeAppointment: number,
  mediaUrl?: string,
  mediaType?: "image" | "document" | "video" | "audio",
  fileName?: string
) {
  const db = await getDb();
  if (!db) {
    console.error("[Reminder] Database not available");
    return;
  }

  try {
    // Calculate target date range
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeAppointment);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log(`[Reminder] Processing reminders for ${daysBeforeAppointment} days before appointment`);

    // Get appointments that need reminders
    const appointmentsToRemind = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        patientName: patients.fullName,
        patientPhone: patients.phone,
        patientEmail: patients.email,
        appointmentDate: appointments.appointmentDate,
        appointmentType: appointments.appointmentType,
        status: appointments.status,
        reminderAttempts: appointments.reminderAttempts,
        lastReminderAt: appointments.lastReminderAt,
        confirmedAt: appointments.confirmedAt,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(
        and(
          gte(appointments.appointmentDate, targetDate),
          lte(appointments.appointmentDate, nextDay),
          or(
            eq(appointments.status, "scheduled"),
            eq(appointments.status, "pending"),
            eq(appointments.status, "confirmed")
          )
        )
      );

    console.log(`[Reminder] Found ${appointmentsToRemind.length} appointments to remind`);

    for (const appointment of appointmentsToRemind) {
      // Check if max attempts reached
      if (appointment.reminderAttempts >= MAX_REMINDER_ATTEMPTS) {
        console.log(`[Reminder] Max attempts reached for appointment ${appointment.id}`);
        continue;
      }

      // Check if we should retry (wait RETRY_DELAY_HOURS between attempts)
      if (appointment.lastReminderAt) {
        const hoursSinceLastReminder =
          (now.getTime() - appointment.lastReminderAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastReminder < RETRY_DELAY_HOURS) {
          console.log(`[Reminder] Too soon to retry appointment ${appointment.id}`);
          continue;
        }
      }

      // Determine if appointment is confirmed
      const isConfirmed = appointment.status === "confirmed" || appointment.confirmedAt !== null;
      
      // Skip if confirmed and already sent reminders for this day
      if (isConfirmed && appointment.reminderAttempts > 0 && daysBeforeAppointment < 2) {
        console.log(`[Reminder] Skipping confirmed appointment ${appointment.id} - already reminded`);
        continue;
      }

      // Send reminder
      const result = await sendReminder(
        appointment.id,
        (appointment.patientName || "Paciente") || "Paciente",
        appointment.phone || appointment.patientPhone || "N/A",
        appointment.patientEmail,
        appointment.appointmentDate,
        appointment.appointmentType,
        isConfirmed,
        daysBeforeAppointment,
        mediaUrl,
        mediaType,
        fileName
      );

      // Log attempts
      const reminderMessage = isConfirmed
        ? generateReminderMessageConfirmed(
            (appointment.patientName || "Paciente") || "Paciente",
            appointment.appointmentDate,
            appointment.appointmentType,
            daysBeforeAppointment
          )
        : generateReminderMessageNotConfirmed(
            (appointment.patientName || "Paciente") || "Paciente",
            appointment.appointmentDate,
            appointment.appointmentType,
            daysBeforeAppointment
          );

      if (result.whatsappSent) {
        await logReminderAttempt(appointment.id, "whatsapp", "sent", reminderMessage);
      } else if (result.error) {
        await logReminderAttempt(appointment.id, "whatsapp", "failed", reminderMessage, result.error);
      }

      if (result.emailSent) {
        await logReminderAttempt(appointment.id, "email", "sent", "Email reminder sent");
      }

      // Update appointment
      await updateAppointmentReminderStatus(
        appointment.id,
        appointment.reminderAttempts + 1
      );

      // Anti-blocking: Wait between processing appointments
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds between appointments
    }

    console.log(`[Reminder] Finished processing reminders for ${daysBeforeAppointment} days before`);
  } catch (error) {
    console.error(`[Reminder] Error processing reminders:`, error);
  }
}

/**
 * Initialize reminder cron jobs
 * Estratégia persistente: insistir até confirmação para não confirmados
 */
export function initializeReminderService() {
  console.log("[Reminder] Initializing reminder service with persistent strategy...");

  // 2 dias antes: 10h, 15h, 19h (para todos)
  cron.schedule("0 10,15,19 * * *", () => {
    console.log("[Reminder] Running 2-day reminder job (10h, 15h, 19h)");
    processReminders(2);
  });

  // 1 dia antes: 6h30 (primeiro do dia)
  cron.schedule("30 6 * * *", () => {
    console.log("[Reminder] Running 1-day reminder job (6h30 - primeiro do dia)");
    processReminders(1);
  });

  // 1 dia antes: a cada 2h a partir das 9h (9h, 11h, 13h, 15h, 17h, 19h, 21h)
  cron.schedule("0 9,11,13,15,17,19,21 * * *", () => {
    console.log("[Reminder] Running 1-day reminder job (a cada 2h)");
    processReminders(1);
  });

  // Dia da consulta: 7h (para confirmados - lembrete final)
  cron.schedule("0 7 * * *", () => {
    console.log("[Reminder] Running same-day reminder job (7h - lembrete final)");
    processReminders(0);
  });

  // Dia da consulta: a cada 2h (9h, 11h, 13h, 15h, 17h, 19h) para não confirmados
  cron.schedule("0 9,11,13,15,17,19 * * *", () => {
    console.log("[Reminder] Running same-day reminder job (a cada 2h - insistência)");
    processReminders(0);
  });

  console.log("[Reminder] Reminder service initialized successfully");
  console.log("[Reminder] Schedules:");
  console.log("  - 2 dias antes: 10h, 15h, 19h (todos)");
  console.log("  - 1 dia antes: 6h30, 9h, 11h, 13h, 15h, 17h, 19h, 21h (insistência para não confirmados)");
  console.log("  - Dia da consulta: 7h (confirmados), 9h-19h a cada 2h (não confirmados)");
}

/**
 * Manually trigger reminders (for testing)
 */
export async function triggerRemindersManually(daysBeforeAppointment: number) {
  console.log(`[Reminder] Manually triggering reminders for ${daysBeforeAppointment} days before`);
  await processReminders(daysBeforeAppointment);
}


/**
 * Send manual reminders for specific appointments or all pending
 */
export async function sendManualReminders(
  appointmentIds?: number[],
  daysBeforeAppointment: number = 1,
  mediaUrl?: string,
  mediaType?: "image" | "document" | "video" | "audio",
  fileName?: string
) {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available", sent: 0, failed: 0 };
  }

  try {
    let appointmentsToRemind;

    if (appointmentIds && appointmentIds.length > 0) {
      // Send to specific appointments
      appointmentsToRemind = await db
        .select({
          id: appointments.id,
          appointmentDate: appointments.appointmentDate,
          appointmentType: appointments.appointmentType,
          status: appointments.status,
          patientId: appointments.patientId,
          patientName: patients.fullName,
          patientPhone: patients.phone,
          patientEmail: patients.email,
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            eq(appointments.id, appointmentIds[0]), // For simplicity, handle one at a time
            or(
              eq(appointments.status, "scheduled"),
              eq(appointments.status, "pending")
            )
          )
        );
    } else {
      // Send to all appointments in the next X days
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() + daysBeforeAppointment);

      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      appointmentsToRemind = await db
        .select({
          id: appointments.id,
          appointmentDate: appointments.appointmentDate,
          appointmentType: appointments.appointmentType,
          status: appointments.status,
          patientId: appointments.patientId,
          patientName: patients.fullName,
          patientPhone: patients.phone,
          patientEmail: patients.email,
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            gte(appointments.appointmentDate, startDate),
            lte(appointments.appointmentDate, endDate),
            or(
              eq(appointments.status, "scheduled"),
              eq(appointments.status, "pending")
            )
          )
        );
    }

    let sent = 0;
    let failed = 0;

    for (const appointment of appointmentsToRemind) {
      if (!appointment.phone || appointment.patientPhone || "N/A" && !appointment.patientEmail) {
        failed++;
        continue;
      }

      // Determine if appointment is confirmed
      const isConfirmed = appointment.status === "confirmed";

      try {
        // Send reminder using sendReminder function (supports n8n + media)
        const result = await sendReminder(
          appointment.id,
          (appointment.patientName || "Paciente") || "Paciente",
          appointment.phone || appointment.patientPhone || "N/A",
          appointment.patientEmail,
          new Date(appointment.appointmentDate),
          appointment.appointmentType,
          isConfirmed,
          daysBeforeAppointment,
          mediaUrl,
          mediaType,
          fileName
        );

        if (result.whatsappSent || result.emailSent) {
          sent++;
        } else {
          failed++;
        }

        // Wait between sends to avoid blocking
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[Reminder] Error sending manual reminder for appointment ${appointment.id}:`, error);
        failed++;
      }
    }

    // Schedule next automatic send in TEST MODE
    if (TEST_MODE_ENABLED && sent > 0) {
      console.log(`[Reminder] TEST MODE: Scheduling next reminder in ${TEST_MODE_INTERVAL_MINUTES} minutes`);
      setTimeout(() => {
        console.log(`[Reminder] TEST MODE: Triggering automatic reminder`);
        sendManualReminders(appointmentIds, daysBeforeAppointment).catch((error) => {
          console.error("[Reminder] TEST MODE: Error in automatic reminder:", error);
        });
      }, TEST_MODE_INTERVAL_MINUTES * 60 * 1000);
    }

    return {
      success: true,
      message: `Recordatórios enviados: ${sent} sucesso, ${failed} falhas`,
      sent,
      failed,
      total: appointmentsToRemind.length,
    };
  } catch (error) {
    console.error("[Reminder] Error in sendManualReminders:", error);
    return { success: false, message: "Erro ao enviar recordatórios", sent: 0, failed: 0 };
  }
}

/**
 * Send waitlist notification when slot becomes available
 */
export async function sendWaitlistNotification(
  phone: string,
  patientName: string,
  availableDate: string,
  availableTime: string
) {
  const message = `🦷 *ODONTO CHIN - Vaga Disponível!*

Olá ${patientName}! 👋

Temos uma ótima notícia! Uma vaga ficou disponível:

📅 *Data:* ${availableDate}
🕐 *Horário:* ${availableTime}

Você está interessado(a) neste horário?

Por favor, responda o mais rápido possível para confirmarmos sua consulta! ⚡

_Esta vaga será oferecida a outros pacientes se não recebermos sua confirmação em breve._

Atenciosamente,
Equipe Odonto Chin 🦷`;

  try {
    // TODO: Implement with Evolution API
    const whatsappConnected = false; // Temporarily disabled
    if (whatsappConnected) {
      // await sendWhatsAppMessage(CLINIC_ID, phone, message);
      console.log(`[Waitlist] Notification sent to ${patientName} via WhatsApp`);
      return { success: true, channel: "whatsapp" };
    } else {
      console.warn(`[Waitlist] WhatsApp not connected, notification not sent to ${patientName}`);
      return { success: false, message: "WhatsApp não conectado" };
    }
  } catch (error) {
    console.error(`[Waitlist] Error sending notification to ${patientName}:`, error);
    throw error;
  }
}
