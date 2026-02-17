/**
 * Database functions for communication channels system
 */

import { db } from "./db";
import {
  communicationChannels,
  channelMessagesLog,
  channelHealthHistory,
  channelAntiblockConfig,
  channelAlerts,
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// ============= COMMUNICATION_CHANNELS =============

export async function getAllChannels(clinicId: number) {
  return db
    .select()
    .from(communicationChannels)
    .where(eq(communicationChannels.clinicId, clinicId))
    .orderBy(desc(communicationChannels.createdAt));
}

export async function getChannelById(channelId: number) {
  const results = await db
    .select()
    .from(communicationChannels)
    .where(eq(communicationChannels.id, channelId))
    .limit(1);
  return results[0] || null;
}

export async function createChannel(data: {
  clinicId: number;
  channelName: string;
  channelType: "whatsapp" | "messenger" | "n8n" | "chatwoot" | "email";
  purpose: "integration" | "reminders" | "both";
  phoneNumber?: string;
  instanceId?: string;
  apiKey?: string;
  apiUrl?: string;
}) {
  const results = await db.insert(communicationChannels).values(data);
  return results[0].insertId;
}

export async function updateChannel(
  channelId: number,
  data: Partial<{
    channelName: string;
    phoneNumber: string;
    isConnected: number;
    connectionStatus: "connected" | "disconnected" | "error" | "pending";
    qrCode: string;
    instanceId: string;
    healthScore: number;
    status: "active" | "blocked" | "warning" | "inactive" | "paused";
    dailyMessageCount: number;
  }>
) {
  await db
    .update(communicationChannels)
    .set(data)
    .where(eq(communicationChannels.id, channelId));
}

export async function deleteChannel(channelId: number) {
  await db
    .delete(communicationChannels)
    .where(eq(communicationChannels.id, channelId));
}

export async function getActiveChannels(clinicId: number, purpose?: string) {
  const conditions = [
    eq(communicationChannels.clinicId, clinicId),
    eq(communicationChannels.status, "active"),
    eq(communicationChannels.isConnected, 1),
  ];

  if (purpose) {
    conditions.push(
      sql`${communicationChannels.purpose} IN ('${purpose}', 'both')`
    );
  }

  return db
    .select()
    .from(communicationChannels)
    .where(and(...conditions))
    .orderBy(communicationChannels.healthScore);
}

// ============= CHANNEL_MESSAGES_LOG =============

export async function logMessage(data: {
  channelId: number;
  appointmentId?: number;
  patientId?: number;
  messageType: "reminder" | "confirmation" | "marketing" | "followup" | "rescheduling" | "other";
  messageContent: string;
  recipientPhone: string;
  messageId?: string;
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
}) {
  const results = await db.insert(channelMessagesLog).values(data);
  return results[0].insertId;
}

export async function updateMessageStatus(
  messageLogId: number,
  status: "pending" | "sent" | "delivered" | "read" | "failed",
  errorMessage?: string
) {
  await db
    .update(channelMessagesLog)
    .set({
      status,
      errorMessage,
      deliveryTimestamp: status === "delivered" ? sql`NOW()` : undefined,
      readTimestamp: status === "read" ? sql`NOW()` : undefined,
    })
    .where(eq(channelMessagesLog.id, messageLogId));
}

export async function getMessageLog(channelId: number, limit = 100) {
  return db
    .select()
    .from(channelMessagesLog)
    .where(eq(channelMessagesLog.channelId, channelId))
    .orderBy(desc(channelMessagesLog.createdAt))
    .limit(limit);
}

export async function getMessageStats(channelId: number, startDate: Date, endDate: Date) {
  const results = await db
    .select({
      total: sql<number>`COUNT(*)`,
      sent: sql<number>`SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END)`,
      delivered: sql<number>`SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)`,
      read: sql<number>`SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
      responses: sql<number>`SUM(CASE WHEN response_received = 1 THEN 1 ELSE 0 END)`,
    })
    .from(channelMessagesLog)
    .where(
      and(
        eq(channelMessagesLog.channelId, channelId),
        sql`${channelMessagesLog.createdAt} >= ${startDate.toISOString()}`,
        sql`${channelMessagesLog.createdAt} <= ${endDate.toISOString()}`
      )
    );

  return results[0];
}

// ============= CHANNEL_HEALTH_HISTORY =============

export async function recordHealthMetrics(data: {
  channelId: number;
  healthScore: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  responsesReceived: number;
  deliveryRate: string;
  readRate: string;
  responseRate: string;
  avgResponseTime: number;
}) {
  await db.insert(channelHealthHistory).values([data]);
}

export async function getHealthHistory(
  channelId: number,
  startDate: Date,
  endDate: Date
) {
  return db
    .select()
    .from(channelHealthHistory)
    .where(
      and(
        eq(channelHealthHistory.channelId, channelId),
        sql`${channelHealthHistory.recordedAt} >= ${startDate.toISOString()}`,
        sql`${channelHealthHistory.recordedAt} <= ${endDate.toISOString()}`
      )
    )
    .orderBy(sql`recorded_at ASC`);
}

export async function getLatestHealthMetrics(channelId: number) {
  const results = await db
    .select()
    .from(channelHealthHistory)
    .where(eq(channelHealthHistory.channelId, channelId))
    .orderBy(sql`recorded_at DESC`)
    .limit(1);
  return results[0] || null;
}

// ============= CHANNEL_ANTIBLOCK_CONFIG =============

export async function getAntiblockConfig(channelId: number) {
  const results = await db
    .select()
    .from(channelAntiblockConfig)
    .where(eq(channelAntiblockConfig.channelId, channelId))
    .limit(1);
  return results[0] || null;
}

export async function createAntiblockConfig(data: {
  channelId: number;
  enabled?: number;
  dailyLimit?: number;
  hourlyLimit?: number;
  minIntervalSeconds?: number;
  maxIntervalSeconds?: number;
  burstLimit?: number;
  burstWindowSeconds?: number;
  cooldownMinutes?: number;
  autoRotateOnLimit?: number;
  autoPauseOnBlock?: number;
  pauseThresholdHealth?: number;
}) {
  const results = await db.insert(channelAntiblockConfig).values(data);
  return results[0].insertId;
}

export async function updateAntiblockConfig(
  channelId: number,
  data: Partial<{
    enabled: number;
    dailyLimit: number;
    hourlyLimit: number;
    minIntervalSeconds: number;
    maxIntervalSeconds: number;
    burstLimit: number;
    burstWindowSeconds: number;
    cooldownMinutes: number;
    autoRotateOnLimit: number;
    autoPauseOnBlock: number;
    pauseThresholdHealth: number;
  }>
) {
  await db
    .update(channelAntiblockConfig)
    .set(data)
    .where(eq(channelAntiblockConfig.channelId, channelId));
}

// ============= CHANNEL_ALERTS =============

export async function createAlert(data: {
  channelId: number;
  alertType: "health_low" | "blocked" | "limit_reached" | "connection_lost" | "high_failure_rate";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  metadata?: any;
}) {
  const results = await db.insert(channelAlerts).values(data);
  return results[0].insertId;
}

export async function getUnresolvedAlerts(channelId: number) {
  return db
    .select()
    .from(channelAlerts)
    .where(
      and(
        eq(channelAlerts.channelId, channelId),
        eq(channelAlerts.isResolved, 0)
      )
    )
    .orderBy(desc(channelAlerts.createdAt));
}

export async function resolveAlert(alertId: number, resolvedBy: number) {
  await db
    .update(channelAlerts)
    .set({
      isResolved: 1,
      resolvedAt: sql`NOW()`,
      resolvedBy,
    })
    .where(eq(channelAlerts.id, alertId));
}

export async function getAllAlerts(channelId: number, limit = 50) {
  return db
    .select()
    .from(channelAlerts)
    .where(eq(channelAlerts.channelId, channelId))
    .orderBy(desc(channelAlerts.createdAt))
    .limit(limit);
}
