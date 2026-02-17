/**
 * Cron Scheduler for Automatic Reminders
 * Following EXACT rules from FAASEDERECORDATORIOSEKANBAN document
 */

import cron from "node-cron";

// Timezone configuration (Paraguay: America/Asuncion, UTC-4)
const TIMEZONE = process.env.TZ || 'America/Asuncion';
import {
  sendReminders2DaysBefore,
  sendReminders1DayBefore,
  sendRemindersSameDay7h,
  sendReminders2hBefore,
} from "./automaticReminderService";

let isSchedulerRunning = false;

export function startReminderScheduler() {
  if (isSchedulerRunning) {
    console.log("Reminder scheduler is already running");
    return;
  }

  console.log("Starting automatic reminder scheduler...");
  console.log(`[Cron Scheduler] Timezone: ${TIMEZONE}`);
  console.log(`[Cron Scheduler] Current server time: ${new Date().toISOString()}`);
  console.log(`[Cron Scheduler] Paraguay time: ${new Date().toLocaleString('es-PY', { timeZone: TIMEZONE })}`);

  // ===== 2 DAYS BEFORE =====
  
  // 10:00 AM - Educational tone
  cron.schedule("0 10 * * *", async () => {
    const now = new Date().toLocaleString('es-PY', { timeZone: TIMEZONE });
    console.log(`[CRON] 2 days before reminders at 10:00 AM - Executed at: ${now}`);
    try {
      await sendReminders2DaysBefore(10);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 3:00 PM - Reinforcement
  cron.schedule("0 15 * * *", async () => {
    const now = new Date().toLocaleString('es-PY', { timeZone: TIMEZONE });
    console.log(`[CRON] 2 days before reminders at 3:00 PM - Executed at: ${now}`);
    try {
      await sendReminders2DaysBefore(15);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 7:00 PM - Emphasis on Dra
  cron.schedule("0 19 * * *", async () => {
    const now = new Date().toLocaleString('es-PY', { timeZone: TIMEZONE });
    console.log(`[CRON] 2 days before reminders at 7:00 PM - Executed at: ${now}`);
    try {
      await sendReminders2DaysBefore(19);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // ===== 1 DAY BEFORE (ONLY IF NOT CONFIRMED) =====
  
  // 7:00 AM - Firmer tone
  cron.schedule("0 7 * * *", async () => {
    const now = new Date().toLocaleString('es-PY', { timeZone: TIMEZONE });
    console.log(`[CRON] 1 day before reminders at 7:00 AM - Executed at: ${now}`);
    try {
      await sendReminders1DayBefore(7);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 8:00 AM - Last confirmation
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] 1 day before reminders at 8:00 AM");
    try {
      await sendReminders1DayBefore(8);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 10:00 AM
  cron.schedule("0 10 * * *", async () => {
    console.log("[CRON] 1 day before reminders at 10:00 AM");
    try {
      await sendReminders1DayBefore(10);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 12:00 PM
  cron.schedule("0 12 * * *", async () => {
    console.log("[CRON] 1 day before reminders at 12:00 PM");
    try {
      await sendReminders1DayBefore(12);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 2:00 PM
  cron.schedule("0 14 * * *", async () => {
    console.log("[CRON] 1 day before reminders at 2:00 PM");
    try {
      await sendReminders1DayBefore(14);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 4:00 PM
  cron.schedule("0 16 * * *", async () => {
    console.log("[CRON] 1 day before reminders at 4:00 PM");
    try {
      await sendReminders1DayBefore(16);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 6:00 PM - Last opportunity
  cron.schedule("0 18 * * *", async () => {
    console.log("[CRON] 1 day before reminders at 6:00 PM");
    try {
      await sendReminders1DayBefore(18);
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // ===== SAME DAY =====
  
  // 7:00 AM - Different message for confirmed vs not confirmed
  cron.schedule("0 7 * * *", async () => {
    const now = new Date().toLocaleString('es-PY', { timeZone: TIMEZONE });
    console.log(`[CRON] Same day reminders at 7:00 AM - Executed at: ${now}`);
    try {
      await sendRemindersSameDay7h();
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // 2H BEFORE - Check every hour (only if NOT confirmed)
  cron.schedule("0 * * * *", async () => {
    const now = new Date().toLocaleString('es-PY', { timeZone: TIMEZONE });
    console.log(`[CRON] Checking 2h before reminders - Executed at: ${now}`);
    try {
      await sendReminders2hBefore();
    } catch (error) {
      console.error("[CRON] Error:", error);
    }
  });

  // ===== MAINTENANCE =====
  
  // Daily counter reset at midnight
  cron.schedule("0 0 * * *", async () => {
    const now = new Date().toLocaleString('es-PY', { timeZone: TIMEZONE });
    console.log(`[CRON] Resetting daily message counters at midnight - Executed at: ${now}`);
    try {
      const { getAllChannels, updateChannel } = await import("./channelsDb");
      const clinicId = 1;
      const channels = await getAllChannels(clinicId);
      
      for (const channel of channels) {
        await updateChannel(channel.id, {
          dailyMessageCount: 0,
        });
      }
      
      console.log("[CRON] Daily counters reset completed");
    } catch (error) {
      console.error("[CRON] Error resetting counters:", error);
    }
  });

  isSchedulerRunning = true;
  console.log("✅ Reminder scheduler started successfully");
  console.log(`⏰ NOTE: Cron runs in server timezone. Set TZ=${TIMEZONE} environment variable for correct timing.`);
  console.log("📅 Scheduled tasks:");
  console.log("  2 DAYS BEFORE: 10h, 15h, 19h");
  console.log("  1 DAY BEFORE (if NOT confirmed): 7h, 8h, 10h, 12h, 14h, 16h, 18h");
  console.log("  SAME DAY: 7h (all), hourly check for 2h before (if NOT confirmed)");
  console.log("  MAINTENANCE: Daily counter reset at midnight");
  console.log(`\n📍 Timezone: ${TIMEZONE}`);
  console.log(`📍 Current server time: ${new Date().toISOString()}`);
  console.log(`📍 Paraguay time: ${new Date().toLocaleString('es-PY', { timeZone: TIMEZONE })}`);
  console.log(`\n⚠️  IMPORTANT: Ensure TZ=${TIMEZONE} is set in production environment!`);
}

export function stopReminderScheduler() {
  if (!isSchedulerRunning) {
    console.log("Reminder scheduler is not running");
    return;
  }

  cron.getTasks().forEach(task => task.stop());
  isSchedulerRunning = false;
  console.log("✅ Reminder scheduler stopped");
}
