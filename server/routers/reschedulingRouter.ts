/**
 * Rescheduling Router
 * 
 * MANDATORY WORKFLOW: Secretary-Only Rescheduling
 * Manages rescheduling alerts for secretary dashboard
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { reschedulingAlerts } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const reschedulingRouter = router({
  /**
   * Get all unread rescheduling alerts for the secretary
   */
  getUnreadAlerts: protectedProcedure.query(async ({ ctx }) => {
    const alerts = await db
      .select()
      .from(reschedulingAlerts)
      .where(
        and(
          eq(reschedulingAlerts.isRead, 0),
          eq(reschedulingAlerts.isResolved, 0)
        )
      )
      .orderBy(desc(reschedulingAlerts.createdAt))
      .limit(10);

    return alerts;
  }),

  /**
   * Get all rescheduling alerts (including read/resolved)
   */
  getAllAlerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        includeResolved: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      let query = db.select().from(reschedulingAlerts);

      if (!input.includeResolved) {
        query = query.where(eq(reschedulingAlerts.isResolved, 0)) as any;
      }

      const alerts = await query
        .orderBy(desc(reschedulingAlerts.createdAt))
        .limit(input.limit);

      return alerts;
    }),

  /**
   * Mark alert as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(reschedulingAlerts)
        .set({
          isRead: 1,
        })
        .where(eq(reschedulingAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Mark alert as resolved
   */
  markAsResolved: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(reschedulingAlerts)
        .set({
          isResolved: 1,
          resolvedAt: new Date().toISOString(),
          resolvedBy: ctx.user.id,
        })
        .where(eq(reschedulingAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Get alert statistics
   */
  getStatistics: protectedProcedure.query(async () => {
    const allAlerts = await db.select().from(reschedulingAlerts);

    const total = allAlerts.length;
    const unread = allAlerts.filter((a) => a.isRead === 0).length;
    const unresolved = allAlerts.filter((a) => a.isResolved === 0).length;
    const resolved = allAlerts.filter((a) => a.isResolved === 1).length;

    return {
      total,
      unread,
      unresolved,
      resolved,
    };
  }),
});
