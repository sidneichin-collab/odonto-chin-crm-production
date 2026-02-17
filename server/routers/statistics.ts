import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const statisticsRouter = router({
  // Get template performance statistics
  getTemplatePerformance: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data - replace with real DB query
      return [
        {
          templateId: 1,
          templateName: "Primera Vez (Amigable)",
          category: "reminder",
          usageCount: 2580,
          sentCount: 2580,
          deliveredCount: 2506,
          readCount: 2289,
          responsesCount: 1654,
          confirmationsCount: 1654,
          deliveryRate: 97.13,
          readRate: 88.73,
          responseRate: 64.11,
          confirmationRate: 64.11,
          avgResponseTime: 42,
        },
        {
          templateId: 2,
          templateName: "Seguimiento 1 (Educativo)",
          category: "reminder",
          usageCount: 926,
          sentCount: 926,
          deliveredCount: 903,
          readCount: 834,
          responsesCount: 654,
          confirmationsCount: 654,
          deliveryRate: 97.52,
          readRate: 90.07,
          responseRate: 70.62,
          confirmationRate: 70.62,
          avgResponseTime: 38,
        },
      ];
    }),

  // Get confirmation rates by various dimensions
  getConfirmationRates: protectedProcedure
    .input(z.object({
      groupBy: z.enum(['day', 'week', 'month', 'treatmentType', 'template']),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data - replace with real DB query
      if (input.groupBy === 'day') {
        return [
          { date: "2026-02-04", total: 176, confirmed: 128, rate: 72.73 },
          { date: "2026-02-05", total: 189, confirmed: 138, rate: 73.02 },
          { date: "2026-02-06", total: 198, confirmed: 145, rate: 73.23 },
          { date: "2026-02-07", total: 167, confirmed: 121, rate: 72.46 },
          { date: "2026-02-08", total: 182, confirmed: 132, rate: 72.53 },
          { date: "2026-02-09", total: 194, confirmed: 141, rate: 72.68 },
          { date: "2026-02-10", total: 128, confirmed: 87, rate: 67.97 },
        ];
      } else if (input.groupBy === 'treatmentType') {
        return [
          { type: "orthodontics", total: 856, confirmed: 612, rate: 71.50 },
          { type: "general_clinic", total: 378, confirmed: 280, rate: 74.07 },
        ];
      }
      
      return [];
    }),

  // Get A/B test results
  getABTestResults: protectedProcedure
    .input(z.object({
      testId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data - replace with real DB query
      return [
        {
          id: 1,
          testName: "Tono Amigable vs Formal",
          status: "completed",
          startDate: "2026-01-15",
          endDate: "2026-02-01",
          variantA: {
            name: "Amigable",
            templateId: 1,
            sampleSize: 1290,
            confirmations: 827,
            confirmationRate: 64.11,
          },
          variantB: {
            name: "Formal",
            templateId: 9,
            sampleSize: 1290,
            confirmations: 748,
            confirmationRate: 57.98,
          },
          winner: "A",
          confidence: 95.8,
          improvement: 6.13,
        },
        {
          id: 2,
          testName: "Horario Envío: 10h vs 15h",
          status: "running",
          startDate: "2026-02-01",
          endDate: null,
          variantA: {
            name: "10:00 AM",
            templateId: 1,
            sampleSize: 234,
            confirmations: 156,
            confirmationRate: 66.67,
          },
          variantB: {
            name: "15:00 PM",
            templateId: 1,
            sampleSize: 234,
            confirmations: 142,
            confirmationRate: 60.68,
          },
          winner: null,
          confidence: 78.3,
          improvement: 5.99,
        },
      ];
    }),

  // Get reminder effectiveness statistics
  getReminderEffectiveness: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data - replace with real DB query
      return {
        withReminders: {
          totalAppointments: 1234,
          confirmed: 892,
          completed: 834,
          noShow: 58,
          cancelled: 342,
          confirmationRate: 72.30,
          completionRate: 67.58,
          noShowRate: 4.70,
          cancellationRate: 27.72,
        },
        withoutReminders: {
          totalAppointments: 456,
          confirmed: 234,
          completed: 198,
          noShow: 36,
          cancelled: 222,
          confirmationRate: 51.32,
          completionRate: 43.42,
          noShowRate: 7.89,
          cancellationRate: 48.68,
        },
        improvement: {
          confirmationRate: 20.98,
          completionRate: 24.16,
          noShowReduction: 3.19,
          cancellationReduction: 20.96,
        },
        byTreatmentType: {
          orthodontics: {
            withReminders: { confirmationRate: 71.50, noShowRate: 4.20 },
            withoutReminders: { confirmationRate: 48.90, noShowRate: 8.50 },
            improvement: { confirmationRate: 22.60, noShowReduction: 4.30 },
          },
          general_clinic: {
            withReminders: { confirmationRate: 74.07, noShowRate: 5.80 },
            withoutReminders: { confirmationRate: 56.20, noShowRate: 6.90 },
            improvement: { confirmationRate: 17.87, noShowReduction: 1.10 },
          },
        },
        bySendTime: [
          { time: "07:00", confirmationRate: 68.50, avgResponseTime: 52 },
          { time: "10:00", confirmationRate: 73.20, avgResponseTime: 45 },
          { time: "15:00", confirmationRate: 71.80, avgResponseTime: 38 },
          { time: "19:00", confirmationRate: 69.40, avgResponseTime: 62 },
        ],
      };
    }),
});
