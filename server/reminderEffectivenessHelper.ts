// @ts-nocheck - Legacy code with type issues
import { getDb } from "./db";
import { reminderLogs, appointments, patients } from "../drizzle/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";

interface ReminderEffectivenessStats {
  hourlyStats: {
    hour: number;
    totalSent: number;
    totalConfirmed: number;
    confirmationRate: number;
    avgResponseTimeMinutes: number | null;
  }[];
  overallStats: {
    totalReminders: number;
    totalConfirmed: number;
    overallConfirmationRate: number;
    bestHour: number | null;
    worstHour: number | null;
  };
  dailyTrend: {
    date: string;
    totalSent: number;
    totalConfirmed: number;
    confirmationRate: number;
  }[];
}

/**
 * Get reminder effectiveness statistics
 * @param startDate - Start date for the analysis period
 * @param endDate - End date for the analysis period
 */
export async function getReminderEffectivenessStats(
  startDate: Date,
  endDate: Date
): Promise<ReminderEffectivenessStats> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all reminders sent in the period
  const reminders = await db
    .select({
      id: reminderLogs.id,
      appointmentId: reminderLogs.appointmentId,
      sentAt: reminderLogs.sentAt,
      status: reminderLogs.status,
      appointmentDate: appointments.appointmentDate,
      appointmentStatus: appointments.status,
      confirmedAt: appointments.confirmedAt,
    })
    .from(reminderLogs)
    .leftJoin(appointments, eq(reminderLogs.appointmentId, appointments.id))
    .where(
      and(
        gte(reminderLogs.sentAt, startDate),
        lte(reminderLogs.sentAt, endDate),
        eq(reminderLogs.status, "sent")
      )
    );

  // Group by hour
  const hourlyMap = new Map<number, {
    totalSent: number;
    totalConfirmed: number;
    responseTimes: number[];
  }>();

  // Initialize all hours (0-23)
  for (let hour = 0; hour < 24; hour++) {
    hourlyMap.set(hour, {
      totalSent: 0,
      totalConfirmed: 0,
      responseTimes: [],
    });
  }

  // Process reminders
  for (const reminder of reminders) {
    const hour = new Date(reminder.sentAt).getHours();
    const hourData = hourlyMap.get(hour)!;

    hourData.totalSent++;

    // Check if appointment was confirmed
    if (reminder.appointmentStatus === "confirmed" && reminder.confirmedAt) {
      hourData.totalConfirmed++;

      // Calculate response time in minutes
      const sentTime = new Date(reminder.sentAt).getTime();
      const confirmedTime = new Date(reminder.confirmedAt).getTime();
      const responseTimeMinutes = Math.floor((confirmedTime - sentTime) / (1000 * 60));
      
      if (responseTimeMinutes > 0 && responseTimeMinutes < 10080) { // Less than 7 days
        hourData.responseTimes.push(responseTimeMinutes);
      }
    }
  }

  // Calculate hourly stats
  const hourlyStats = Array.from(hourlyMap.entries())
    .map(([hour, data]) => ({
      hour,
      totalSent: data.totalSent,
      totalConfirmed: data.totalConfirmed,
      confirmationRate: data.totalSent > 0 ? (data.totalConfirmed / data.totalSent) * 100 : 0,
      avgResponseTimeMinutes: data.responseTimes.length > 0
        ? Math.floor(data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length)
        : null,
    }))
    .sort((a, b) => a.hour - b.hour);

  // Find best and worst hours
  const hoursWithData = hourlyStats.filter(h => h.totalSent > 0);
  let bestHour = null;
  let worstHour = null;

  if (hoursWithData.length > 0) {
    bestHour = hoursWithData.reduce((max, h) => 
      h.confirmationRate > max.confirmationRate ? h : max
    ).hour;

    worstHour = hoursWithData.reduce((min, h) => 
      h.confirmationRate < min.confirmationRate ? h : min
    ).hour;
  }

  // Calculate overall stats
  const totalReminders = reminders.length;
  const totalConfirmed = reminders.filter(
    r => r.appointmentStatus === "confirmed"
  ).length;
  const overallConfirmationRate = totalReminders > 0
    ? (totalConfirmed / totalReminders) * 100
    : 0;

  // Calculate daily trend
  const dailyMap = new Map<string, {
    totalSent: number;
    totalConfirmed: number;
  }>();

  for (const reminder of reminders) {
    const dateKey = new Date(reminder.sentAt).toISOString().split("T")[0];
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { totalSent: 0, totalConfirmed: 0 });
    }

    const dayData = dailyMap.get(dateKey)!;
    dayData.totalSent++;

    if (reminder.appointmentStatus === "confirmed") {
      dayData.totalConfirmed++;
    }
  }

  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalSent: data.totalSent,
      totalConfirmed: data.totalConfirmed,
      confirmationRate: data.totalSent > 0 ? (data.totalConfirmed / data.totalSent) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    hourlyStats,
    overallStats: {
      totalReminders,
      totalConfirmed,
      overallConfirmationRate,
      bestHour,
      worstHour,
    },
    dailyTrend,
  };
}
