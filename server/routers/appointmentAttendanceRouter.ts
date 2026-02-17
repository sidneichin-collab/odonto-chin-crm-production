import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { z } from "zod";
import { ENV } from "../_core/env";

export const appointmentAttendanceRouter = router({
  markAsCompleted: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const appointment = await db.getAppointmentById(input.appointmentId);
        if (!appointment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
        }
        
        // Update appointment status to completed
        await db.updateAppointment(input.appointmentId, {
          status: 'completed',
          // Note: completedAt and satisfactionSurveyStatus fields don't exist in schema
        });
        
        console.log(`[Attendance] Appointment ${input.appointmentId} marked as completed`);
        
        return { success: true, message: 'Appointment marked as completed' };
      } catch (error) {
        console.error('[Error] markAsCompleted:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark appointment as completed',
        });
      }
    }),

  markAsNoShow: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const appointment = await db.getAppointmentById(input.appointmentId);
        if (!appointment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
        }
        
        // Update appointment status to no_show
        await db.updateAppointment(input.appointmentId, {
          status: 'no_show',
        });
        
        console.log(`[Attendance] Appointment ${input.appointmentId} marked as no-show`);
        
        return { success: true, message: 'Appointment marked as no-show' };
      } catch (error) {
        console.error('[Error] markAsNoShow:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark appointment as no-show',
        });
      }
    }),
});
