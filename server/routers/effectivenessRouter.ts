/**
 * Effectiveness Metrics Router
 * Provides metrics and analytics for reminder effectiveness
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../db';
import { appointments, clinics } from '../../drizzle/schema';
import { sql, and, gte, lte, eq, count } from 'drizzle-orm';

export const effectivenessRouter = router({
  /**
   * Get confirmation rate by clinic
   */
  getConfirmationRateByClinic: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      
      const results = await db
        .select({
          clinicId: appointments.clinicId,
          clinicName: clinics.name,
          total: count(),
          confirmed: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Confirmada' THEN 1 ELSE 0 END)`,
          pending: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Pendiente' THEN 1 ELSE 0 END)`,
          noShow: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Faltaram' THEN 1 ELSE 0 END)`,
        })
        .from(appointments)
        .leftJoin(clinics, eq(appointments.clinicId, clinics.id))
        .where(
          and(
            gte(appointments.appointmentDate, new Date(startDate)),
            lte(appointments.appointmentDate, new Date(endDate))
          )
        )
        .groupBy(appointments.clinicId, clinics.name);

      return results.map(row => ({
        clinicId: row.clinicId,
        clinicName: row.clinicName || 'Sin nombre',
        total: Number(row.total),
        confirmed: Number(row.confirmed),
        pending: Number(row.pending),
        noShow: Number(row.noShow),
        confirmationRate: row.total > 0 ? (Number(row.confirmed) / Number(row.total)) * 100 : 0,
      }));
    }),

  /**
   * Get no-show reduction over time
   */
  getNoShowReduction: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      
      const results = await db
        .select({
          date: sql<string>`DATE(${appointments.appointmentDate})`,
          total: count(),
          noShow: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Faltaram' THEN 1 ELSE 0 END)`,
        })
        .from(appointments)
        .where(
          and(
            gte(appointments.appointmentDate, new Date(startDate)),
            lte(appointments.appointmentDate, new Date(endDate))
          )
        )
        .groupBy(sql`DATE(${appointments.appointmentDate})`)
        .orderBy(sql`DATE(${appointments.appointmentDate})`);

      return results.map(row => ({
        date: row.date,
        total: Number(row.total),
        noShow: Number(row.noShow),
        noShowRate: row.total > 0 ? (Number(row.noShow) / Number(row.total)) * 100 : 0,
      }));
    }),

  /**
   * Get status distribution
   */
  getStatusDistribution: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      
      const results = await db
        .select({
          status: appointments.status,
          count: count(),
        })
        .from(appointments)
        .where(
          and(
            gte(appointments.appointmentDate, new Date(startDate)),
            lte(appointments.appointmentDate, new Date(endDate))
          )
        )
        .groupBy(appointments.status);

      return results.map(row => ({
        status: row.status,
        count: Number(row.count),
      }));
    }),

  /**
   * Get overall effectiveness metrics
   */
  getOverallMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      
      const result = await db
        .select({
          total: count(),
          confirmed: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Confirmada' THEN 1 ELSE 0 END)`,
          pending: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Pendiente' THEN 1 ELSE 0 END)`,
          noShow: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Faltaram' THEN 1 ELSE 0 END)`,
          completed: sql<number>`SUM(CASE WHEN ${appointments.status} = 'Completada' THEN 1 ELSE 0 END)`,
        })
        .from(appointments)
        .where(
          and(
            gte(appointments.appointmentDate, new Date(startDate)),
            lte(appointments.appointmentDate, new Date(endDate))
          )
        );

      const row = result[0];
      const total = Number(row.total);
      
      return {
        total,
        confirmed: Number(row.confirmed),
        pending: Number(row.pending),
        noShow: Number(row.noShow),
        completed: Number(row.completed),
        confirmationRate: total > 0 ? (Number(row.confirmed) / total) * 100 : 0,
        noShowRate: total > 0 ? (Number(row.noShow) / total) * 100 : 0,
        completionRate: total > 0 ? (Number(row.completed) / total) * 100 : 0,
      };
    }),
});
