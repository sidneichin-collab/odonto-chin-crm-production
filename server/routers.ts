import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ============================================================================
// MIDDLEWARE: Tenant isolation
// ============================================================================

const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.tenantId && ctx.user.role !== "super-admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Usuario no asignado a una clínica",
    });
  }
  return next({ ctx });
});

const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "super-admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acceso solo para super-administrador",
    });
  }
  return next({ ctx });
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  
  // ============================================================================
  // AUTH ROUTER
  // ============================================================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // TENANT (CLINIC) ROUTER - Super Admin only
  // ============================================================================
  tenants: router({
    list: superAdminProcedure.query(async () => {
      return await db.getAllTenants();
    }),

    create: superAdminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        whatsappNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTenant(input);
      }),

    update: superAdminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateTenant(id, updates);
        return { success: true };
      }),

    getById: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTenantById(input.id);
      }),
  }),

  // ============================================================================
  // DASHBOARD ROUTER
  // ============================================================================
  dashboard: router({
    stats: tenantProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId!;
      return await db.getDashboardStats(tenantId);
    }),

    statsByDate: tenantProcedure
      .input(z.object({
        date: z.string(), // ISO date string
      }))
      .query(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        return await db.getDashboardStatsByDate(tenantId, input.date);
      }),
  }),

  // ============================================================================
  // PATIENTS ROUTER
  // ============================================================================
  patients: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId!;
      return await db.getPatientsByTenant(tenantId);
    }),

    getById: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        return await db.getPatientById(input.id, tenantId);
      }),

    create: tenantProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["M", "F", "Otro"]).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(1),
        whatsappNumber: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        medicalHistory: z.string().optional(),
        allergies: z.string().optional(),
        medications: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        const patient = await db.createPatient({
          ...input,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          tenantId,
        });

        // Log audit
        await db.logAudit({
          tenantId,
          userId: ctx.user.id,
          action: "CREATE_PATIENT",
          entityType: "patient",
          entityId: patient.id,
          newValue: JSON.stringify(input),
        });

        return patient;
      }),

    update: tenantProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["M", "F", "Otro"]).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsappNumber: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        medicalHistory: z.string().optional(),
        allergies: z.string().optional(),
        medications: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        status: z.enum(["Activo", "Inactivo", "En Tratamiento"]).optional(),
        isAtRisk: z.boolean().optional(),
        riskReason: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        const { id, ...updates } = input;
        
        await db.updatePatient(id, tenantId, {
          ...updates,
          dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined,
        });

        // Log audit
        await db.logAudit({
          tenantId,
          userId: ctx.user.id,
          action: "UPDATE_PATIENT",
          entityType: "patient",
          entityId: id,
          newValue: JSON.stringify(updates),
        });

        return { success: true };
      }),

    atRisk: tenantProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId!;
      return await db.getAtRiskPatients(tenantId);
    }),
  }),

  // ============================================================================
  // APPOINTMENTS ROUTER
  // ============================================================================
  appointments: router({
    list: tenantProcedure
      .input(z.object({
        type: z.enum(["Ortodontia", "Clinico General"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        return await db.getAppointmentsByTenant(tenantId, input.type);
      }),

    today: tenantProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId!;
      return await db.getTodayAppointments(tenantId);
    }),

    create: tenantProcedure
      .input(z.object({
        patientId: z.number(),
        type: z.enum(["Ortodontia", "Clinico General"]),
        title: z.string().min(1),
        description: z.string().optional(),
        appointmentDate: z.string(),
        duration: z.number().default(30),
        dentistName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        const appointment = await db.createAppointment({
          ...input,
          appointmentDate: new Date(input.appointmentDate),
          tenantId,
        });

        // Log audit
        await db.logAudit({
          tenantId,
          userId: ctx.user.id,
          action: "CREATE_APPOINTMENT",
          entityType: "appointment",
          entityId: appointment.id,
          newValue: JSON.stringify(input),
        });

        return appointment;
      }),

    updateStatus: tenantProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Pendiente", "Confirmado", "En Tratamiento", "Completado", "Cancelado", "No Asistió"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        await db.updateAppointment(input.id, tenantId, {
          status: input.status,
        });

        // Log audit
        await db.logAudit({
          tenantId,
          userId: ctx.user.id,
          action: "UPDATE_APPOINTMENT_STATUS",
          entityType: "appointment",
          entityId: input.id,
          newValue: JSON.stringify({ status: input.status }),
        });

        return { success: true };
      }),

    update: tenantProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        appointmentDate: z.string().optional(),
        duration: z.number().optional(),
        dentistName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        const { id, ...updates } = input;
        
        await db.updateAppointment(id, tenantId, {
          ...updates,
          appointmentDate: updates.appointmentDate ? new Date(updates.appointmentDate) : undefined,
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // WAITING LIST ROUTER
  // ============================================================================
  waitingList: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId!;
      return await db.getWaitingListByTenant(tenantId);
    }),

    add: tenantProcedure
      .input(z.object({
        patientId: z.number(),
        serviceType: z.enum(["Ortodontia", "Clinico General"]),
        priority: z.enum(["Alta", "Media", "Baja"]).default("Media"),
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        const entry = await db.addToWaitingList({
          ...input,
          preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
          tenantId,
        });

        // Log audit
        await db.logAudit({
          tenantId,
          userId: ctx.user.id,
          action: "ADD_TO_WAITING_LIST",
          entityType: "waitingList",
          entityId: entry.id,
          newValue: JSON.stringify(input),
        });

        return entry;
      }),

    updateStatus: tenantProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["En Espera", "Contactado", "Agendado", "Cancelado"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        await db.updateWaitingListEntry(input.id, tenantId, {
          status: input.status,
          lastContactedAt: input.status === "Contactado" ? new Date() : undefined,
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // WHATSAPP ROUTER
  // ============================================================================
  whatsapp: router({
    messages: tenantProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId!;
      return await db.getWhatsappMessagesByTenant(tenantId);
    }),

    sendReminder: tenantProcedure
      .input(z.object({
        appointmentId: z.number(),
        patientId: z.number(),
        phoneNumber: z.string(),
        messageContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.user.tenantId!;
        
        // Log the message (actual sending will be handled by Evolution API integration)
        const message = await db.logWhatsappMessage({
          tenantId,
          patientId: input.patientId,
          appointmentId: input.appointmentId,
          messageType: "Recordatorio",
          phoneNumber: input.phoneNumber,
          messageContent: input.messageContent,
          status: "Pendiente",
        });

        // Log audit
        await db.logAudit({
          tenantId,
          userId: ctx.user.id,
          action: "SEND_WHATSAPP_REMINDER",
          entityType: "whatsappMessage",
          entityId: message.id,
          newValue: JSON.stringify(input),
        });

        return message;
      }),
  }),
});

export type AppRouter = typeof appRouter;
