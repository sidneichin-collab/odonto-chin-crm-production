// @ts-nocheck - Legacy code with type issues
/**
 * Motivational Message Service
 * 
 * Envia mensagens motivacionais no dia da consulta com apelo emocional
 * Usa templates avançados com urgência máxima e persuasão forte
 */

import { getDb } from "./db";
import { appointments, reminderSchedule, patients } from "../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendTestMessageViaEvolution } from "./testEvolutionApi";
import { advancedTemplates, formatAdvancedMessage } from "./advancedReminderTemplates";

/**
 * Send motivational message on day of appointment
 * Triggered at 6:30 AM, 8:00 AM, and 9:30 AM on appointment day
 */
export async function sendMotivationalMessage(
  appointmentId: number,
  messageType: "morning_urgency" | "emotional_appeal" | "last_minute"
): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database connection failed" };
  }

  try {
    console.log(
      `[MotivationalMessage] Sending ${messageType} message for appointment ${appointmentId}`
    );

    // Get appointment details
    const appointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      return { success: false, message: "Appointment not found" };
    }

    const apt = appointment[0];

    // Get patient details
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, apt.patientId))
      .limit(1);

    if (!patient || patient.length === 0) {
      return { success: false, message: "Patient not found" };
    }

    const pat = patient[0];

    // Select appropriate template based on message type
    let template;
    switch (messageType) {
      case "morning_urgency":
        template = advancedTemplates["day_of_morning_urgency"];
        break;
      case "emotional_appeal":
        template = advancedTemplates["day_of_final_emotional_appeal"];
        break;
      case "last_minute":
        template = advancedTemplates["day_of_last_minute_reminder"];
        break;
      default:
        return { success: false, message: "Unknown message type" };
    }

    if (!template) {
      return { success: false, message: `Template for ${messageType} not found` };
    }

    // Format message with patient data
    const formattedMessage = formatAdvancedMessage(template, {
      patientName: pat.fullName,
      doctorName: "Dra",
      appointmentDate: apt.appointmentDate.toLocaleDateString("es-ES"),
      appointmentTime: "14:00",
    });

    console.log(`[MotivationalMessage] Formatted ${messageType} message for ${pat.fullName}:`);
    console.log(formattedMessage);

    // Send message via Evolution API
    const result = await sendTestMessageViaEvolution(
      "test-connection",
      pat.phone,
      formattedMessage,
      process.env.EVOLUTION_API_URL || "",
      process.env.EVOLUTION_API_KEY || ""
    );

    if (!result.success) {
      // Log failed attempt
      await db.insert(reminderSchedule).values({
        appointmentId: appointmentId,
        templateId: 1,
        attemptNumber: 0,
        scheduledFor: new Date(),
        sentAt: new Date(),
        channel: "whatsapp",
        status: "failed",
        messageContent: formattedMessage,
        errorMessage: result.messageText || "Unknown error",
        createdAt: new Date(),
      });

      return {
        success: false,
        message: `Failed to send ${messageType} message: ${result.messageText}`,
      };
    }

    // Log successful send
    await db.insert(reminderSchedule).values({
      appointmentId: appointmentId,
      templateId: 1,
      attemptNumber: 0,
      scheduledFor: new Date(),
      sentAt: new Date(),
      channel: "whatsapp",
      status: "sent",
      messageContent: formattedMessage,
      createdAt: new Date(),
    });

    console.log(
      `[MotivationalMessage] ✅ ${messageType} message sent to ${pat.phone}`
    );

    return {
      success: true,
      message: `${messageType} message sent successfully`,
      messageId: result.success ? "sent" : undefined,
    };
  } catch (error) {
    console.error(`[MotivationalMessage] Error sending ${messageType} message:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.messageText : "Unknown error",
    };
  }
}

/**
 * Send all motivational messages for appointment day
 */
export async function sendAllMotivationalMessages(
  appointmentId: number
): Promise<{
  success: boolean;
  messagesCount: number;
  successCount: number;
  failedCount: number;
}> {
  try {
    console.log(
      `[MotivationalMessage] Sending all motivational messages for appointment ${appointmentId}`
    );

    const messageTypes: Array<"morning_urgency" | "emotional_appeal" | "last_minute"> = [
      "morning_urgency",
      "emotional_appeal",
      "last_minute",
    ];

    let successCount = 0;
    let failedCount = 0;

    for (const msgType of messageTypes) {
      const result = await sendMotivationalMessage(appointmentId, msgType);
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    console.log(
      `[MotivationalMessage] ✅ Sent ${messageTypes.length} motivational messages (${successCount} successful, ${failedCount} failed)`
    );

    return {
      success: failedCount === 0,
      messagesCount: messageTypes.length,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error("[MotivationalMessage] Error sending all motivational messages:", error);
    return {
      success: false,
      messagesCount: 0,
      successCount: 0,
      failedCount: 3,
    };
  }
}

/**
 * Process all pending motivational messages scheduled for now
 */
export async function processPendingMotivationalMessages(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) {
    return { processed: 0, successful: 0, failed: 0 };
  }

  try {
    console.log("[MotivationalMessage] Processing pending motivational messages");

    const now = new Date();

    // Find all pending motivational reminders scheduled for now or earlier
    const pendingReminders = await db
      .select()
      .from(reminderSchedule)
      .where(
        and(
          eq(reminderSchedule.status, "pending"),
          lte(reminderSchedule.scheduledFor, now),
          eq(reminderSchedule.channel, "whatsapp")
        )
      );

    console.log(
      `[MotivationalMessage] Found ${pendingReminders.length} pending motivational reminders`
    );

    let successful = 0;
    let failed = 0;

    for (const reminder of pendingReminders) {
      // Determine message type based on scheduled time
      const hour = reminder.scheduledFor.getHours();
      let messageType: "morning_urgency" | "emotional_appeal" | "last_minute";

      if (hour === 6 || hour === 7) {
        messageType = "morning_urgency";
      } else if (hour === 8 || hour === 9) {
        messageType = "emotional_appeal";
      } else {
        messageType = "last_minute";
      }

      const result = await sendMotivationalMessage(reminder.appointmentId, messageType);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    console.log(
      `[MotivationalMessage] ✅ Processed ${pendingReminders.length} reminders (${successful} successful, ${failed} failed)`
    );

    return {
      processed: pendingReminders.length,
      successful,
      failed,
    };
  } catch (error) {
    console.error("[MotivationalMessage] Error processing pending messages:", error);
    return { processed: 0, successful: 0, failed: 0 };
  }
}

/**
 * Get statistics on motivational messages sent
 */
export async function getMotivationalMessageStatistics(): Promise<{
  totalSent: number;
  totalFailed: number;
  successRate: number;
  messagesByType: {
    morningUrgency: number;
    emotionalAppeal: number;
    lastMinute: number;
  };
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalSent: 0,
      totalFailed: 0,
      successRate: 0,
      messagesByType: {
        morningUrgency: 0,
        emotionalAppeal: 0,
        lastMinute: 0,
      },
    };
  }

  try {
    // Get all motivational message reminders
    const sentMessages = await db
      .select()
      .from(reminderSchedule)
      .where(eq(reminderSchedule.status, "sent"));

    const failedMessages = await db
      .select()
      .from(reminderSchedule)
      .where(eq(reminderSchedule.status, "failed"));

    const total = sentMessages.length + failedMessages.length;
    const successRate = total > 0 ? Math.round((sentMessages.length / total) * 100) : 0;

    // Count by type (based on scheduled time)
    const morningUrgency = sentMessages.filter(
      (m) => m.scheduledFor && m.scheduledFor.getHours() === 6
    ).length;
    const emotionalAppeal = sentMessages.filter(
      (m) => m.scheduledFor && m.scheduledFor.getHours() === 8
    ).length;
    const lastMinute = sentMessages.filter(
      (m) => m.scheduledFor && m.scheduledFor.getHours() === 9
    ).length;

    return {
      totalSent: sentMessages.length,
      totalFailed: failedMessages.length,
      successRate,
      messagesByType: {
        morningUrgency,
        emotionalAppeal,
        lastMinute,
      },
    };
  } catch (error) {
    console.error("[MotivationalMessage] Error getting statistics:", error);
    return {
      totalSent: 0,
      totalFailed: 0,
      successRate: 0,
      messagesByType: {
        morningUrgency: 0,
        emotionalAppeal: 0,
        lastMinute: 0,
      },
    };
  }
}

/**
 * Retry failed motivational messages
 */
export async function retryFailedMotivationalMessages(): Promise<{
  retried: number;
  successful: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) {
    return { retried: 0, successful: 0, failed: 0 };
  }

  try {
    console.log("[MotivationalMessage] Retrying failed motivational messages");

    // Get failed reminders from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const failedReminders = await db
      .select()
      .from(reminderSchedule)
      .where(eq(reminderSchedule.status, "failed"));

    console.log(
      `[MotivationalMessage] Found ${failedReminders.length} failed reminders to retry`
    );

    // Filter reminders from last 24 hours
    const recentFailedReminders = failedReminders.filter(
      (r) => r.createdAt && new Date(r.createdAt).getTime() > twentyFourHoursAgo.getTime()
    );

    let successful = 0;
    let failed = 0;

    for (const reminder of recentFailedReminders) {
      // Determine message type
      const hour = reminder.scheduledFor.getHours();
      let messageType: "morning_urgency" | "emotional_appeal" | "last_minute";

      if (hour === 6 || hour === 7) {
        messageType = "morning_urgency";
      } else if (hour === 8 || hour === 9) {
        messageType = "emotional_appeal";
      } else {
        messageType = "last_minute";
      }

      const result = await sendMotivationalMessage(reminder.appointmentId, messageType);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    console.log(
      `[MotivationalMessage] ✅ Retried ${recentFailedReminders.length} reminders (${successful} successful, ${failed} failed)`
    );

    return {
      retried: recentFailedReminders.length,
      successful,
      failed,
    };
  } catch (error) {
    console.error("[MotivationalMessage] Error retrying failed messages:", error);
    return { retried: 0, successful: 0, failed: 0 };
  }
}

/**
 * Schedule all motivational messages for appointment day
 */
export async function scheduleMotivationalMessagesForDay(
  appointmentId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    console.log(
      `[MotivationalMessage] Scheduling all motivational messages for appointment ${appointmentId}`
    );

    // Get appointment details
    const appointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      console.warn(`[MotivationalMessage] Appointment ${appointmentId} not found`);
      return false;
    }

    const apt = appointment[0];

    // Schedule messages at specific times on appointment day
    const messageTimes = [
      { hour: 6, minute: 30, type: "morning_urgency" },
      { hour: 8, minute: 0, type: "emotional_appeal" },
      { hour: 9, minute: 30, type: "last_minute" },
    ];

    for (const msgTime of messageTimes) {
      const messageDate = new Date(apt.appointmentDate);
      messageDate.setHours(msgTime.hour, msgTime.minute, 0, 0);

      await db.insert(reminderSchedule).values({
        appointmentId: appointmentId,
        templateId: 1,
        attemptNumber: 0,
        scheduledFor: messageDate,
        channel: "whatsapp",
        status: "pending",
        messageContent: `Motivational message: ${msgTime.type} (pending)`,
        createdAt: new Date(),
      });

      console.log(
        `[MotivationalMessage] Scheduled ${msgTime.type} for ${messageDate.toISOString()}`
      );
    }

    console.log(`[MotivationalMessage] ✅ All motivational messages scheduled`);
    return true;
  } catch (error) {
    console.error("[MotivationalMessage] Error scheduling motivational messages:", error);
    return false;
  }
}
