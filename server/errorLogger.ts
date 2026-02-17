/**
 * Error Logger Service
 * Centralized error logging with real-time notifications
 */
import { getDb } from './db';
import { apiErrorLogs } from '../drizzle/schema';
import { notifyOwner } from './_core/notification';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface LogErrorOptions {
  endpoint: string;
  method: string;
  errorMessage: string;
  stackTrace?: string;
  userId?: number;
  severity?: ErrorSeverity;
  statusCode?: number;
  requestBody?: any;
  responseBody?: any;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Log error to database and send notification if critical
 */
export async function logError(options: LogErrorOptions): Promise<void> {
  try {
    const {
      endpoint,
      method,
      errorMessage,
      stackTrace,
      userId,
      severity = 'error',
      statusCode,
      requestBody,
      responseBody,
      userAgent,
      ipAddress,
    } = options;

    const db = await getDb();
    if (!db) {
      console.error('[ErrorLogger] Database not available');
      return;
    }

    // Insert error log into database
    const [result] = await db.insert(apiErrorLogs).values({
      endpoint,
      method,
      errorMessage,
      stackTrace: stackTrace || null,
      userId: userId || null,
      severity,
      statusCode: statusCode || null,
      requestBody: requestBody ? JSON.stringify(requestBody) : null,
      responseBody: responseBody ? JSON.stringify(responseBody) : null,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      notified: 0,
    });

    // Send real-time notification for critical errors
    if (severity === 'critical') {
      const notificationSent = await notifyOwner({
        title: `🚨 Error Crítico en API`,
        content: `Endpoint: ${method} ${endpoint}\nError: ${errorMessage}\n\nStack: ${stackTrace?.substring(0, 200) || 'N/A'}`,
      });

      if (notificationSent && result.insertId) {
        // Mark as notified
        await db.update(apiErrorLogs)
          .set({ notified: 1, notifiedAt: new Date().toISOString() })
          .where(eq(apiErrorLogs.id, result.insertId));
      }
    }

    console.error(`[ErrorLogger] ${severity.toUpperCase()}: ${method} ${endpoint} - ${errorMessage}`);
  } catch (error) {
    // Fallback: log to console if database insert fails
    console.error('[ErrorLogger] Failed to log error to database:', error);
    console.error('[ErrorLogger] Original error:', options);
  }
}

/**
 * Get recent errors with filters
 */
export async function getRecentErrors(filters?: {
  severity?: ErrorSeverity;
  endpoint?: string;
  userId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { severity, endpoint, userId, limit = 100 } = filters || {};

  let query = db.select().from(apiErrorLogs);

  const conditions = [];
  if (severity) {
    conditions.push(eq(apiErrorLogs.severity, severity));
  }
  if (endpoint) {
    conditions.push(eq(apiErrorLogs.endpoint, endpoint));
  }
  if (userId) {
    conditions.push(eq(apiErrorLogs.userId, userId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(desc(apiErrorLogs.createdAt)).limit(limit);
}

/**
 * Get error statistics for last 24 hours
 */
export async function getErrorStats() {
  const db = await getDb();
  if (!db) return { critical: 0, errors: 0, warnings: 0, total: 0 };

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [critical] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(apiErrorLogs)
    .where(and(
      eq(apiErrorLogs.severity, 'critical'),
      gte(apiErrorLogs.createdAt, last24h)
    ));

  const [errors] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(apiErrorLogs)
    .where(and(
      eq(apiErrorLogs.severity, 'error'),
      gte(apiErrorLogs.createdAt, last24h)
    ));

  const [warnings] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(apiErrorLogs)
    .where(and(
      eq(apiErrorLogs.severity, 'warning'),
      gte(apiErrorLogs.createdAt, last24h)
    ));

  return {
    critical: Number(critical?.count || 0),
    errors: Number(errors?.count || 0),
    warnings: Number(warnings?.count || 0),
    total: Number(critical?.count || 0) + Number(errors?.count || 0) + Number(warnings?.count || 0),
  };
}
