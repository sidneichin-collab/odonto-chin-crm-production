import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import * as db from '../db';
import { 
  getPendingRescheduleAlerts, 
  markAlertAsViewed, 
  markAlertAsCompleted 
} from '../rescheduleNotificationService';

export const rescheduleRouter = router({
  /**
   * Get pending reschedule alerts (unviewed)
   */
  getPendingAlerts: protectedProcedure.query(async ({ ctx }) => {
    // If user has clinic, filter by clinic
    // Otherwise (admin), show all
    const clinicId = ctx.user.clinicId;
    
    if (clinicId) {
      const alerts = await getPendingRescheduleAlerts(clinicId);
      return alerts;
    }
    
    // Admin: get all unviewed alerts
    const alerts = await db.getUnviewedRescheduleAlerts();
    return alerts;
  }),

  /**
   * Mark alert as viewed (dismiss from popup)
   */
  markAsViewed: protectedProcedure
    .input(z.object({
      alertId: z.number()
    }))
    .mutation(async ({ input }) => {
      const success = await markAlertAsViewed(input.alertId);
      return { success };
    }),

  /**
   * Mark alert as completed (after secretary contacted patient)
   */
  markAsCompleted: protectedProcedure
    .input(z.object({
      alertId: z.number()
    }))
    .mutation(async ({ input }) => {
      const success = await markAlertAsCompleted(input.alertId);
      return { success };
    }),

  /**
   * Legacy compatibility
   */
  getUnviewed: publicProcedure.query(async () => {
    const alerts = await db.getUnviewedRescheduleAlerts();
    return alerts;
  }),

  markAsResolved: publicProcedure
    .input(z.object({
      alertId: z.number()
    }))
    .mutation(async ({ input }) => {
      const success = await db.markRescheduleAlertAsResolved(input.alertId);
      return { success };
    }),
});
