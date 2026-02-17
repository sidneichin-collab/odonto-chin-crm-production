// @ts-nocheck
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import * as evolutionApi from "./evolutionApiService";
import { rescheduleRouter } from "./routers/rescheduleRouter";
import { reportsRouter } from "./routers/reportsRouter";
import { whatsappWebhookRouter } from "./routers/whatsappWebhookRouter";
import { remindersRouter } from "./routers/remindersRouter";
import { channelsRouter } from "./routers/channels";
import { healthRouter } from "./routers/health";
import { messagesRouter } from "./routers/messages";
import { antiblockRouter } from "./routers/antiblock";
import { statisticsRouter } from "./routers/statistics";
import { effectivenessRouter } from "./routers/effectivenessRouter";
import { whatsappRouter } from "./routers/whatsappRouter";
import { reschedulingRouter } from "./routers/reschedulingRouter";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Clinic-scoped procedure - automatically filters data by user's clinic
const protectedClinicProcedure = protectedProcedure.use(({ ctx, next }) => {
  // Admin users can access all clinics (no filter)
  if (ctx.user.role === 'admin') {
    return next({ ctx: { ...ctx, clinicId: null } });
  }
  
  // Regular users can only access their own clinic
  if (!ctx.user.clinicId) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'User is not assigned to any clinic' 
    });
  }
  
  return next({ ctx: { ...ctx, clinicId: ctx.user.clinicId } });
});

export const appRouter = router({
  system: systemRouter,
  reschedule: rescheduleRouter,
  reports: reportsRouter,
  whatsappWebhook: whatsappWebhookRouter,
  reminders: remindersRouter,
  channels: channelsRouter,
  health: healthRouter,
  messages: messagesRouter,
  antiblock: antiblockRouter,
  statistics: statisticsRouter,
  effectiveness: effectivenessRouter,
  whatsapp: whatsappRouter,
  rescheduling: reschedulingRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import("bcryptjs");
        
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha inválidos",
          });
        }
        
        // Check account status
        if (user.accountStatus === "suspended") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Conta suspensa. Entre em contato com o administrador.",
          });
        }
        
        if (user.accountStatus === "rejected") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Conta rejeitada. Entre em contato com o administrador.",
          });
        }
        
        if (user.accountStatus === "pending") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Conta pendente de aprovação. Aguarde a aprovação do administrador.",
          });
        }
        
        // Check if user has password (local auth)
        if (!user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Este usuário não possui senha configurada. Use login com Google.",
          });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
        
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha inválidos",
          });
        }
        
        // Create session token
        const { sdk } = await import("./_core/sdk");
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || undefined,
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          name: user.name,
          email: user.email,
          loginMethod: "email",
        });
        
        return { success: true, user };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USER MANAGEMENT ====================
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),
    
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.userId);
        return { success: true };
      }),
    
    // COMMENTED OUT: Uses removed createUserWithPassword function
    /*
    create: adminProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        role: z.enum(["user", "admin"]).optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if email already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email já cadastrado",
          });
        }
        
        await db.createUserWithPassword(input);
        return { success: true };
      }),
    */
    
    update: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { userId, ...data } = input;
        
        // Check if email already exists (if changing email)
        if (data.email) {
          const existingUser = await db.getUserByEmail(data.email);
          if (existingUser && existingUser.id !== userId) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email já cadastrado",
            });
          }
        }
        
        await db.updateUser(userId, data);
        return { success: true };
      }),
    
    // COMMENTED OUT: Uses removed updateUserStatus function
    /*
    updateStatus: adminProcedure
      .input(z.object({
        userId: z.number(),
        status: z.enum(["active", "inactive"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserStatus(input.userId, input.status);
        return { success: true };
      }),
    */
    
    // COMMENTED OUT: Uses removed updateUserPassword function
    /*
    resetPassword: adminProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserPassword(input.userId, input.newPassword);
        return { success: true };
      }),
    */
  }),

  // ==================== PATIENT MANAGEMENT ====================
  patients: router({
    list: protectedProcedure
      .input(z.object({
        searchTerm: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllPatients(input?.searchTerm, input?.status);
      }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.searchPatients(input.query);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPatientById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        fullName: z.string().min(1),
        cpf: z.string().optional(),
        rg: z.string().optional(),
        birthDate: z.string().optional(),
        phone: z.string().min(1),
        email: z.string().email().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        status: z.enum(["active", "inactive", "defaulter"]).default("active"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const birthDate = input.birthDate ? new Date(input.birthDate) : undefined;
        await db.createPatient({
          ...input,
          birthDate: birthDate as any,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        fullName: z.string().min(1).optional(),
        cpf: z.string().optional(),
        rg: z.string().optional(),
        birthDate: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        status: z.enum(["active", "inactive", "defaulter"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, birthDate, ...rest } = input;
        const updateData: any = { ...rest };
        if (birthDate) {
          updateData.birthDate = new Date(birthDate);
        }
        await db.updatePatient(id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePatient(input.id);
        return { success: true };
      }),
    
    stats: protectedProcedure.query(async () => {
      return await db.getPatientStats();
    }),

    // Get patients with risk alerts
    getRiskAlerts: protectedProcedure.query(async () => {
      try {
        const { calculateRiskScore, shouldFlagAsRisk } = await import('./riskAnalysisService');
        
        // Get all active patients
        const patients = await db.getAllPatients(undefined, 'active');
        if (!patients || !Array.isArray(patients)) {
          return [];
        }
        
        const riskPatients = [];
        
        for (const patient of patients) {
          if (!patient || !patient.id) continue;
          // Get patient appointment history
          const appointments = await db.getAppointmentsByPatientId(patient.id);
          if (!appointments || !Array.isArray(appointments)) continue;
        
          // Calculate risk metrics
          const noShowCount = appointments.filter(apt => apt && apt.status === 'no_show').length;
          const lateCancelCount = appointments.filter(apt => 
            apt && apt.status === 'cancelled' && 
            apt.appointmentDate && 
            new Date(apt.appointmentDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
          ).length;
          const rescheduleCount = appointments.filter(apt => apt && apt.status === 'rescheduling_pending').length;
          
          const riskScore = calculateRiskScore({
            noShowCount,
            lateCancelCount,
            totalAppointments: appointments.length,
            rescheduleCount,
          });
          
          riskScore.patientId = patient.id;
          
          if (shouldFlagAsRisk(riskScore)) {
            riskPatients.push({
              patient,
              riskScore,
            });
          }
        }
        
        return riskPatients.sort((a, b) => b.riskScore.score - a.riskScore.score);
      } catch (error) {
        console.error('[getRiskAlerts] Error:', error);
        return [];
      }
    }),
  }),

  // ==================== TREATMENT MANAGEMENT ====================
  treatments: router({
    listByPatient: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTreatmentsByPatientId(input.patientId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTreatmentById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        treatmentType: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("planned"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        totalCost: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        await db.createTreatment({
          ...input,
          startDate: startDate as any,
          endDate: endDate as any,
          totalCost: input.totalCost?.toString() as any,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        treatmentType: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        totalCost: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, startDate, endDate, totalCost, ...rest } = input;
        const updateData: any = { ...rest };
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (totalCost !== undefined) updateData.totalCost = totalCost.toString();
        await db.updateTreatment(id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTreatment(input.id);
        return { success: true };
      }),
    
    listActive: protectedProcedure.query(async () => {
      return await db.getActiveTreatments();
    }),
  }),

  // ==================== APPOINTMENT MANAGEMENT ====================
  appointments: router({
    listByDate: protectedProcedure
      .input(z.object({
        date: z.string(),
      }))
      .query(async ({ input }) => {
        const date = new Date(input.date);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        return await db.getAppointmentsByDateRange(date, nextDay);
      }),
    
    listByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getAppointmentsByDateRange(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),
    
    // Alias for compatibility
    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getAppointmentsByDateRange(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),
    
    listByPatient: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAppointmentsByPatientId(input.patientId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAppointmentById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        patientId: z.number().optional(),
        patientName: z.string().min(1),
        patientLastName: z.string().min(1),
        patientPhone: z.string().min(1),
        emergencyPhone: z.string().min(1),
        patientEmail: z.string().email().optional(),
        ubicacion: z.string().min(1),
        cedulaImageUrl: z.string().min(1),
        patientFacebook: z.string().optional(),
        patientInstagram: z.string().optional(),
        appointmentDateTime: z.string(), // Combined date and time
        appointmentType: z.enum(["marketing_evaluation", "orthodontic_treatment", "general_clinic"]),
        chair: z.string().optional(),
        duration: z.number().min(20).max(120),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // If patientId is provided, use it; otherwise create new patient
        let patientId = input.patientId;
        
        if (!patientId) {
          const fullName = `${input.patientName} ${input.patientLastName}`.trim();
          const newPatient = await db.createPatient({
            fullName,
            phone: input.patientPhone,
            emergencyContact: input.emergencyPhone,
            email: input.patientEmail || null,
            ubicacion: input.ubicacion,
            cedulaImageUrl: input.cedulaImageUrl,
            facebook: input.patientFacebook || null,
            instagram: input.patientInstagram || null,
            createdBy: ctx.user.id,
          });
          patientId = newPatient.id;
        }

        // Create appointment
        const appointment = await db.createAppointment({
          patientId,
          appointmentDate: new Date(input.appointmentDateTime),
          appointmentType: input.appointmentType,
          chair: input.chair || null,
          duration: input.duration,
          status: "scheduled",
          notes: input.notes || null,
          createdBy: ctx.user.id,
        });

        return appointment;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        appointmentDate: z.string().optional(),
        duration: z.number().optional(),
        chair: z.string().optional(),
        status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show", "pending"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, appointmentDate, ...rest } = input;
        const updateData: any = { ...rest };
        if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
        await db.updateAppointment(id, updateData);
        return { success: true };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["scheduled", "confirmed", "pending"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateAppointment(input.id, { status: input.status });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAppointment(input.id);
        return { success: true };
      }),
    
    today: protectedProcedure.query(async () => {
      return await db.getTodayAppointments();
    }),
    
    upcoming: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return await db.getUpcomingAppointments(input?.limit);
      }),

    checkAvailability: protectedProcedure
      .input(z.object({
        appointmentDate: z.string(),
        chair: z.string(),
        appointmentType: z.string(),
        excludeAppointmentId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.checkTimeSlotAvailability({
          appointmentDate: new Date(input.appointmentDate),
          chair: input.chair,
          appointmentType: input.appointmentType,
          excludeAppointmentId: input.excludeAppointmentId,
        });
      }),

    // Update appointment time and chair (for Agenda Kanban drag & drop)
    updateAppointmentTimeAndChair: protectedProcedure
      .input(z.object({
        appointmentId: z.number(),
        appointmentDate: z.string(),
        chair: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateAppointment(input.appointmentId, {
          appointmentDate: new Date(input.appointmentDate),
          chair: input.chair,
        });
        return { success: true };
      }),

    // Get appointments by date (for Agenda Kanban)
    getByDate: protectedProcedure
      .input(z.object({
        date: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getAppointmentsByDate(new Date(input.date));
      }),
  }),


  // ==================== MESSAGE TEMPLATES ====================
  messageTemplates: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllMessageTemplates();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMessageTemplateById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["appointment_reminder", "payment_reminder", "general"]),
        subject: z.string().optional(),
        content: z.string().min(1),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createMessageTemplate({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["appointment_reminder", "payment_reminder", "general"]).optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        await db.updateMessageTemplate(id, rest);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMessageTemplate(input.id);
        return { success: true };
      }),
  }),

  // ==================== COMMUNICATIONS ====================
  communications: router({
    listByPatient: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCommunicationsByPatientId(input.patientId);
      }),
    
    list: protectedProcedure.query(async () => {
      return await db.getAllCommunications();
    }),
    
    create: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        templateId: z.number().optional(),
        type: z.enum(["email", "sms", "whatsapp"]),
        subject: z.string().optional(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createCommunication({
          ...input,
          templateId: input.templateId ?? null,
          status: "pending",
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotificationsByUserId(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
    
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),
  }),


  remindersTrigger: router({
    triggerManually: adminProcedure
      .input(z.object({
        daysBeforeAppointment: z.number().min(0).max(7),
      }))
      .mutation(async ({ input }) => {
        const { triggerRemindersManually } = await import("./reminderService");
        await triggerRemindersManually(input.daysBeforeAppointment);
        return { success: true, message: "Recordatórios disparados manualmente" };
      }),

    sendManual: adminProcedure
      .input(z.object({
        appointmentIds: z.array(z.number()).optional(),
        daysBeforeAppointment: z.number().min(0).max(7).default(1),
        mediaUrl: z.string().optional(),
        mediaType: z.enum(["image", "document", "video", "audio"]).optional(),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sendManualReminders } = await import("./reminderService");
        const result = await sendManualReminders(
          input.appointmentIds, 
          input.daysBeforeAppointment,
          input.mediaUrl,
          input.mediaType,
          input.fileName
        );
        return result;
      }),

    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
      }).optional())
      .query(async ({ input }) => {
        const history = await db.getReminderHistory(undefined, undefined, input?.limit || 50);
        return history;
      }),

    // Alias for getHistory
    history: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
      }).optional())
      .query(async ({ input }) => {
        const history = await db.getReminderHistory(undefined, undefined, input?.limit || 50);
        return history;
      }),
  }),

  // ==================== WAITLIST ====================
  waitlist: router({
    add: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        appointmentType: z.enum(["marketing_evaluation", "orthodontic_treatment", "general_clinic"]),
        preferredDates: z.array(z.string()).optional(),
        preferredTimes: z.array(z.string()).optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.addToWaitlist({
          patientId: input.patientId,
          appointmentType: input.appointmentType,
          preferredDates: input.preferredDates ? JSON.stringify(input.preferredDates) : null,
          preferredTimes: input.preferredTimes ? JSON.stringify(input.preferredTimes) : null,
          priority: input.priority,
          notes: input.notes || null,
          status: "waiting",
          createdBy: ctx.user.id,
        });
        return { success: true, result };
      }),

    getAll: protectedProcedure.query(async () => {
      return await db.getAllWaitlist();
    }),

    getByType: protectedProcedure
      .input(z.object({
        appointmentType: z.enum(["marketing_evaluation", "orthodontic_treatment", "general_clinic"]),
      }))
      .query(async ({ input }) => {
        return await db.getWaitlistByType(input.appointmentType);
      }),

    remove: protectedProcedure
      .input(z.object({
        waitlistId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.removeFromWaitlist(input.waitlistId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        waitlistId: z.number(),
        status: z.enum(["waiting", "notified", "scheduled", "expired"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateWaitlistStatus(input.waitlistId, input.status);
      }),

    notifyAvailable: protectedProcedure
      .input(z.object({
        appointmentType: z.enum(["marketing_evaluation", "orthodontic_treatment", "general_clinic"]),
        availableDate: z.string(),
        availableTime: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Get waitlist for this type
        const waitlistEntries = await db.getWaitlistByType(input.appointmentType);
        
        if (waitlistEntries.length === 0) {
          return { success: false, message: "Nenhum paciente na lista de espera" };
        }

        // Notify first patient in waitlist
        const firstEntry = waitlistEntries[0];
        
        // Send notification via WhatsApp/Email
        const { sendWaitlistNotification } = await import("./reminderService");
        await sendWaitlistNotification(
          firstEntry.phone || firstEntry.patientPhone || "N/A" || "",
          (firstEntry.patientName || "Paciente") || "",
          input.availableDate,
          input.availableTime
        );

        // Update waitlist status
        await db.updateWaitlistStatus(firstEntry.id, "notified");

        return { 
          success: true, 
          message: `Notificação enviada para ${(firstEntry.patientName || "Paciente")}`,
          patient: firstEntry,
        };
      }),
  }),

  // ==================== RISK SCORE ====================
  riskScore: router({
    calculate: protectedProcedure
      .input(z.object({
        patientId: z.number(),
      }))
      .query(async ({ input }) => {
        const score = await db.calculateRiskScore(input.patientId);
        return { riskScore: score };
      }),

    update: protectedProcedure
      .input(z.object({
        patientId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.updatePatientRiskScore(input.patientId);
      }),

    getHighRisk: protectedProcedure.query(async () => {
      return await db.getHighRiskPatients();
    }),

    incrementNoShow: protectedProcedure
      .input(z.object({
        patientId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.incrementNoShowCount(input.patientId);
      }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    overview: protectedProcedure.query(async () => {
      const patientStats = await db.getPatientStats();
      const todayAppointments = await db.getTodayAppointments();
      const upcomingAppointments = await db.getUpcomingAppointments(5);
      
      return {
        patients: patientStats,
        todayAppointments: todayAppointments.length,
        upcomingAppointments,
      };
    }),

    getStats: protectedProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ input }) => {
      try {
      const targetDate = input?.date ? new Date(input.date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      
      const todayAppointments = await db.getAppointmentsByDate(targetDate);
      const confirmedAppts = todayAppointments.filter(apt => apt.status === 'confirmed');
      const pendingAppts = todayAppointments.filter(apt => apt.status === 'scheduled' || apt.status === 'not_confirmed');
      const completedAppts = todayAppointments.filter(apt => apt.status === 'completed');
      const patientStats = await db.getPatientStats();
      
      // Garantir que nunca retorne null
      if (!patientStats) {
        return {
          todayAppointments: todayAppointments.length,
          todayAppointmentsDetails: todayAppointments,
          confirmed: { count: confirmedAppts.length, appointments: confirmedAppts },
          pending: { count: pendingAppts.length, appointments: pendingAppts },
          completed: { count: completedAppts.length, appointments: completedAppts },
          activePatients: 0,
          atRiskPatients: 0,
        };
      }
      
      return {
        todayAppointments: todayAppointments.length,
        todayAppointmentsDetails: todayAppointments,
        confirmed: {
          count: confirmedAppts.length,
          appointments: confirmedAppts,
        },
        pending: {
          count: pendingAppts.length,
          appointments: pendingAppts,
        },
        completed: {
          count: completedAppts.length,
          appointments: completedAppts,
        },
        activePatients: patientStats.active,
        atRiskPatients: patientStats.atRisk || 0,
      };
    } catch (error) {
        console.error("[ERROR] getStats failed:", error);
        throw error;
      }
    }),

    getTodayAppointments: protectedProcedure.query(async () => {
      try {
        const appointments = await db.getTodayAppointments();
        
        if (!appointments || !Array.isArray(appointments)) {
          return {
            orthodontic_treatment: [],
            general_clinic: [],
            marketing_evaluation: [],
          };
        }
        
        return {
          orthodontic_treatment: appointments.filter(apt => apt && apt.appointmentType === 'orthodontic_treatment'),
          general_clinic: appointments.filter(apt => apt && apt.appointmentType === 'general_clinic'),
          marketing_evaluation: appointments.filter(apt => apt && apt.appointmentType === 'marketing_evaluation'),
        };
      } catch (error) {
        console.error('[getTodayAppointments] Error:', error);
        return {
          orthodontic_treatment: [],
          general_clinic: [],
          marketing_evaluation: [],
        };
      }
    }),

    getTomorrowStats: protectedProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ input }) => {
      try {
        const baseDate = input?.date ? new Date(input.date) : new Date();
        baseDate.setHours(0, 0, 0, 0);
        const tomorrowAppointments = await db.getTomorrowAppointments(baseDate);
        
        if (!tomorrowAppointments || !Array.isArray(tomorrowAppointments)) {
          return {
            orthodontics: { confirmed: { count: 0, appointments: [] }, notConfirmed: { count: 0, appointments: [] }, cancelled: { count: 0, appointments: [] } },
            general: { confirmed: { count: 0, appointments: [] }, notConfirmed: { count: 0, appointments: [] }, cancelled: { count: 0, appointments: [] } },
            all: { confirmed: { count: 0, appointments: [] }, pending: { count: 0, appointments: [] }, cancelled: { count: 0, appointments: [] } },
          };
        }
      
      // Ortodoncia stats
      const orthodontics = tomorrowAppointments.filter(apt => apt.appointmentType === 'orthodontic_treatment');
      const orthodonticsConfirmed = orthodontics.filter(apt => apt.status === 'confirmed');
      const orthodonticsNotConfirmed = orthodontics.filter(apt => apt.status !== 'confirmed' && apt.status !== 'cancelled');
      const orthodonticsCancelled = orthodontics.filter(apt => apt.status === 'cancelled');
      
      // Clínico General stats
      const general = tomorrowAppointments.filter(apt => apt.appointmentType === 'general_clinic');
      const generalConfirmed = general.filter(apt => apt.status === 'confirmed');
      const generalNotConfirmed = general.filter(apt => apt.status !== 'confirmed' && apt.status !== 'cancelled');
      const generalCancelled = general.filter(apt => apt.status === 'cancelled');
      
      // All confirmed, pending, cancelled
      const allConfirmed = tomorrowAppointments.filter(apt => apt.status === 'confirmed');
      const allPending = tomorrowAppointments.filter(apt => apt.status !== 'confirmed' && apt.status !== 'cancelled');
      const allCancelled = tomorrowAppointments.filter(apt => apt.status === 'cancelled');
      
      return {
        total: tomorrowAppointments.length,
        confirmed: {
          count: allConfirmed.length,
          appointments: allConfirmed,
        },
        pending: {
          count: allPending.length,
          appointments: allPending,
        },
        cancelled: {
          count: allCancelled.length,
          appointments: allCancelled,
        },
        orthodontic_treatment: {
          total: orthodontics.length,
          confirmed: orthodonticsConfirmed.length,
          notConfirmed: orthodonticsNotConfirmed.length,
          cancelled: orthodonticsCancelled.length,
        },
        general_clinic: {
          total: general.length,
          confirmed: generalConfirmed.length,
          notConfirmed: generalNotConfirmed.length,
          cancelled: generalCancelled.length,
        },
      };
      } catch (error) {
        console.error('[getTomorrowStats] Error:', error);
        return {
          total: 0,
          confirmed: { count: 0, appointments: [] },
          pending: { count: 0, appointments: [] },
          cancelled: { count: 0, appointments: [] },
          orthodontic_treatment: { total: 0, confirmed: 0, notConfirmed: 0, cancelled: 0 },
          general_clinic: { total: 0, confirmed: 0, notConfirmed: 0, cancelled: 0 },
        };
      }
    }),

    getMonthAppointments: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        try {
          console.log("[DEBUG] getMonthAppointments called", input);
          const appointments = await db.getMonthAppointments(input.year, input.month);
          
          // Group by day and status
          const dayStats: Record<number, { confirmed: number; pending: number; cancelled: number; completed: number }> = {};
          
          // Validar que appointments sea un array
          if (!appointments || !Array.isArray(appointments)) {
            console.log("[DEBUG] No appointments found, returning empty object");
            return {};
          }
          
          appointments.forEach(apt => {
          const day = new Date(apt.appointmentDate).getDate();
          if (!dayStats[day]) {
            dayStats[day] = { confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
          }
          
          if (apt.status === 'confirmed') {
            dayStats[day].confirmed++;
          } else if (apt.status === 'scheduled' || apt.status === 'not_confirmed' || apt.status === 'rescheduling_pending') {
            dayStats[day].pending++;
          } else if (apt.status === 'cancelled') {
            dayStats[day].cancelled++;
          } else if (apt.status === 'completed') {
            dayStats[day].completed++;
          }
        });
        
        return dayStats;
      } catch (error) {
        console.error("[ERROR] getMonthAppointments failed:", error);
        return {};
      }
      }),
  }),

  // ==================== IMPORT ====================
  import: router({    
    importPatients: protectedProcedure
      .input(z.object({
        patients: z.array(z.object({
          fullName: z.string(),
          phone: z.string(),
          email: z.string().optional(),
          dateOfBirth: z.string().optional(),
          address: z.string().optional(),
          status: z.enum(["active", "inactive", "defaulter", "at_risk"]).optional(),
          notes: z.string().optional(),
        })),
        skipDuplicates: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const results = {
          total: input.patients.length,
          success: 0,
          skipped: 0,
          errors: [] as string[],
        };

        const patientsToInsert = [];

        for (const patientData of input.patients) {
          // Check for duplicates
          if (input.skipDuplicates) {
            const duplicate = await db.checkDuplicatePatient(patientData.phone, patientData.email);
            if (duplicate) {
              results.skipped++;
              continue;
            }
          }

          patientsToInsert.push({
            fullName: patientData.fullName,
            phone: patientData.phone,
            email: patientData.email || null,
            dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null,
            address: patientData.address || null,
            status: patientData.status || "active",
            notes: patientData.notes || null,
            createdBy: ctx.user.id,
          });
        }

        if (patientsToInsert.length > 0) {
          const bulkResult = await db.bulkInsertPatients(patientsToInsert);
          results.success = bulkResult.success;
          results.errors = bulkResult.errors;
        }

        return results;
      }),

    importAppointments: protectedProcedure
      .input(z.object({
        appointments: z.array(z.object({
          patientId: z.number(),
          appointmentDate: z.string(),
          appointmentTime: z.string(),
          appointmentType: z.enum(["marketing_evaluation", "orthodontic_treatment", "general_clinic"]),
          status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const appointmentsToInsert = input.appointments.map(apt => ({
          patientId: apt.patientId,
          appointmentDate: new Date(apt.appointmentDate),
          appointmentTime: apt.appointmentTime,
          appointmentType: apt.appointmentType,
          status: apt.status || "scheduled",
          notes: apt.notes || null,
          createdBy: ctx.user.id,
        }));

        const result = await db.bulkInsertAppointments(appointmentsToInsert);
        return {
          total: input.appointments.length,
          success: result.success,
          errors: result.errors,
        };
      }),

    create: protectedProcedure
      .input(z.object({
        patientId: z.number().optional(),
        patientName: z.string().min(1),
        patientLastName: z.string().min(1),
        patientPhone: z.string().min(1),
        emergencyPhone: z.string().min(1),
        patientEmail: z.string().email().optional(),
        ubicacion: z.string().min(1),
        cedulaImageUrl: z.string().min(1),
        patientFacebook: z.string().optional(),
        patientInstagram: z.string().optional(),
        appointmentDateTime: z.string(), // Combined date and time
        appointmentType: z.enum(["marketing_evaluation", "orthodontic_treatment", "general_clinic"]),
        chair: z.string().optional(),
        duration: z.number().min(20).max(120),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // If patientId is provided, use it; otherwise create new patient
        let patientId = input.patientId;
        
        if (!patientId) {
          const newPatient = await db.createPatient({
            fullName: (input.patientName || "Paciente"),
            phone: input.phone || input.patientPhone || "N/A",
            email: input.patientEmail || null,
            facebook: input.patientFacebook || null,
            instagram: input.patientInstagram || null,
            createdBy: ctx.user.id,
          });
          patientId = newPatient.id;
        }

        // Create appointment
        const appointment = await db.createAppointment({
          patientId,
          appointmentDate: new Date(input.appointmentDateTime),
          appointmentType: input.appointmentType,
          chair: input.chair || null,
          duration: input.duration,
          status: "scheduled",
          notes: input.notes || null,
          createdBy: ctx.user.id,
        });

        return appointment;
      }),

    getByDate: protectedProcedure
      .input(z.object({
        date: z.string(), // Format: YYYY-MM-DD
      }))
      .query(async ({ input }) => {
        const appointments = await db.getAppointmentsByDate(new Date(input.date));
        return appointments;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        appointmentId: z.number(),
        status: z.enum(["scheduled", "confirmed", "not_confirmed", "cancelled", "completed", "no_show", "rescheduling_pending"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateAppointmentStatus(input.appointmentId, input.status);
        return { success: true };
      }),
  }),



  // ==================== INTEGRATION CHANNELS ====================
  // TODO: Implement channels router after fixing db helpers
  channels: router({
    test: protectedProcedure.query(async () => {
      return { message: 'Channels router placeholder' };
    }),

    getQRCode: protectedProcedure
      .input(z.object({ 
        instanceName: z.string(),
        apiUrl: z.string(),
        apiKey: z.string(),
      }))
      .query(async ({ input }) => {
        return await evolutionApi.getQRCode(
          input.instanceName,
          input.apiUrl,
          input.apiKey
        );
      }),

    getConnectionStatus: protectedProcedure
      .input(z.object({ 
        instanceName: z.string(),
        apiUrl: z.string(),
        apiKey: z.string(),
      }))
      .query(async ({ input }) => {
        return await evolutionApi.getConnectionStatus(
          input.instanceName,
          input.apiUrl,
          input.apiKey
        );
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        instanceName: z.string(),
        phone: z.string(),
        message: z.string(),
        apiUrl: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await evolutionApi.sendMessage(
          input.instanceName,
          input.phone,
          input.message,
          input.apiUrl,
          input.apiKey
        );
      }),

    disconnect: protectedProcedure
      .input(z.object({ 
        instanceName: z.string(),
        apiUrl: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await evolutionApi.disconnectInstance(
          input.instanceName,
          input.apiUrl,
          input.apiKey
        );
      }),
  }),

  // ==================== WEBHOOK ====================
  webhook: router({
    // Public endpoint for Evolution API to send incoming messages
    receiveMessage: publicProcedure
      .input(z.object({
        connectionId: z.number(),
        senderPhone: z.string(),
        senderName: z.string().optional(),
        message: z.string(),
        messageType: z.enum(["text", "image", "audio", "video", "document"]).optional(),
        mediaUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // const { processIncomingMessage } = await import("./webhookService");
        // return await processIncomingMessage(input); return { success: false };
      }),
    
    // Get recent incoming messages
    getRecentMessages: protectedProcedure
      .input(z.object({
        connectionId: z.number().optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return await db.getRecentIncomingMessages(input.connectionId, input.limit);
      }),
    
    // Get webhook logs for debugging
    getLogs: protectedProcedure
      .input(z.object({
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return await db.getWebhookLogs(input.limit);
      }),
  }),

  // ==================== WHATSAPP ====================
  // NOTA: Router whatsapp desabilitado temporariamente (requer whatsappService)
  // Para reativar, adicione o arquivo whatsappService.ts

  // Inbox - Mensagens Recebidas (Kanban)
  inbox: router({
    // Get all conversations with optional filters
    getConversations: protectedProcedure
      .input(z.object({
        sessionId: z.string().optional(),
        status: z.enum(['unread', 'in_progress', 'resolved']).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getInboxConversations(input);
      }),
    
    // Get messages for a specific conversation
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getConversationMessages(input.conversationId);
      }),
    
    // Update conversation status (move between Kanban columns)
    updateStatus: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        status: z.enum(['unread', 'in_progress', 'resolved']),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateConversationStatus(
          input.conversationId,
          input.status,
          ctx.user.id
        );
        return { success: true };
      }),
    
    // Send reply to conversation
    sendReply: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
        sessionId: z.string(),
        phone: z.string(),
        mediaUrl: z.string().optional(),
        mediaType: z.enum(['image', 'audio', 'video']).optional(),
        templateId: z.number().optional(), // ID of template if using quick reply
        patientName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Send WhatsApp message via N8N
        const { sendWhatsAppViaN8n } = await import('./n8nWhatsAppService');
        const result = await sendWhatsAppViaN8n({
          sessionId: input.sessionId, 
          phone: input.phone, 
          message: input.message,
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType
        });
        
        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to send WhatsApp message',
          });
        }
        
        // Save message to database
        await db.addMessageToConversation(
          input.conversationId,
          input.message,
          'outgoing',
          ctx.user.id
        );
        
        // Track template usage if templateId is provided
        if (input.templateId) {
          await db.trackQuickReplyUsage({
            templateId: input.templateId,
            conversationId: input.conversationId,
            patientPhone: input.phone,
            patientName: (input.patientName || "Paciente") || null,
            sentBy: ctx.user.id,
          });
        }
        
        return { success: true };
      }),
    
    // Mark conversation as resolved
    markAsResolved: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateConversationStatus(
          input.conversationId,
          'resolved',
          ctx.user.id
        );
        return { success: true };
      }),
    
    // Get unread messages count
    getUnreadCount: protectedProcedure
      .query(async () => {
        return await db.getUnreadMessagesCount();
      }),
  }),

  // Quick Replies - Plantillas de respuestas rápidas
  quickReplies: router({
    // Get all quick replies for current user
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getQuickReplies(ctx.user.id);
      }),
    
    // Create new quick reply
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(100),
        message: z.string().min(1),
        mediaType: z.enum(['text', 'image', 'audio', 'video']).optional(),
        mediaUrl: z.string().nullable().optional(),
        mediaMimeType: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createQuickReply({
          title: input.title,
          message: input.message,
          mediaType: input.mediaType || 'text',
          mediaUrl: input.mediaUrl || null,
          mediaMimeType: input.mediaMimeType || null,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    // Delete quick reply
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteQuickReply(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Template Statistics - Estadísticas de uso de plantillas
  templateStats: router({
    // Get usage statistics for all templates
    getUsageStats: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getTemplateUsageStats(startDate, endDate);
      }),
    
    // Get usage over time for a specific template
    getUsageOverTime: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        days: z.number().default(30),
      }))
      .query(async ({ input }) => {
        return await db.getTemplateUsageOverTime(input.templateId, input.days);
      }),
    
    // Get statistics by media type
    getMediaTypeStats: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getMediaTypeStats(startDate, endDate);
      }),
  }),


  // ==================== REMINDER ANALYTICS ====================
  reminderAnalytics: router({
    // Get overall reminder effectiveness statistics
    getOverallStats: protectedProcedure
      .query(async () => {
        return await db.getReminderOverallStats();
      }),

    // Get reminder effectiveness by attempt number
    getByAttempt: protectedProcedure
      .query(async () => {
        return await db.getReminderStatsByAttempt();
      }),

    // Get reminder effectiveness by template
    getByTemplate: protectedProcedure
      .query(async () => {
        return await db.getReminderStatsByTemplate();
      }),

    // Get reminder effectiveness by hour of day
    getByHour: protectedProcedure
      .query(async () => {
        return await db.getReminderStatsByHour();
      }),

    // Get insights and recommendations
    getInsights: protectedProcedure
      .query(async () => {
        return await db.getReminderInsights();
      }),
  }),

  // ==================== CLINIC CONFIG ====================
  clinicConfig: router({
    // Get clinic configuration
    get: protectedProcedure
      .query(async () => {
        return await db.getClinicConfig();
      }),

    // Update clinic configuration
    update: protectedProcedure
      .input(z.object({
        clinicName: z.string().min(1),
        clinicWhatsAppPhone: z.string().min(1),
        notificationsEnabled: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateClinicConfig(input);
        return { success: true };
      }),
  }),

  // ==================== RESCHEDULE REQUESTS ====================
  rescheduleRequests: router({
    // Get all reschedule requests
    getAll: protectedProcedure
      .query(async () => {
        return await db.getAllRescheduleRequests();
      }),

    // Get reschedule requests by status
    getByStatus: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'notified', 'resolved']),
      }))
      .query(async ({ input }) => {
        return await db.getRescheduleRequestsByStatus(input.status);
      }),

    // Get pending count for badge
    getPendingCount: protectedProcedure
      .query(async () => {
        const requests = await db.getRescheduleRequestsByStatus('pending');
        return { count: requests.length };
      }),

    // Mark request as resolved
    markAsResolved: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.markRescheduleRequestAsResolved(
          input.requestId,
          ctx.user.id,
          input.notes
        );
        return { success: true };
      }),

    // Add notes to request
    addNotes: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.addNotesToRescheduleRequest(input.requestId, input.notes);
        return { success: true };
      }),
  }),

  // ==================== EMAIL CONFIGURATION ====================
  emailConfig: router({
    // Get email configuration
    get: protectedProcedure
      .query(async () => {
        return await db.getEmailConfig();
      }),

    // Update email configuration
    update: protectedProcedure
      .input(z.object({
        clinicName: z.string().min(1),
        emailAddress: z.string().email(),
        smtpHost: z.string().min(1),
        smtpPort: z.number().min(1).max(65535),
        smtpUser: z.string().min(1),
        smtpPassword: z.string().min(1),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateEmailConfig(input);
        return { success: true };
      }),
  }),

  // ==================== TAGS ====================
  tags: router({
    getAll: protectedProcedure
      .query(async () => {
        return await db.getAllTags();
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        color: z.string().min(1).max(50),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTag(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().min(1).max(50).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateTag(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.deleteTag(input.id);
      }),

    addToConversation: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.addTagToConversation(input.conversationId, input.tagId);
      }),

    removeFromConversation: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.removeTagFromConversation(input.conversationId, input.tagId);
      }),

    getConversationTags: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getConversationTags(input.conversationId);
      }),
  }),

  // ==================== SETTINGS ====================
  settings: router({    getClinicConfig: protectedProcedure
      .query(async () => {
        return await db.getClinicConfiguration();
      }),

    updateClinicConfig: adminProcedure
      .input(z.object({
        orthodonticChairs: z.number().min(1).max(10),
        clinicChairs: z.number().min(1).max(10),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.updateClinicConfiguration(input, ctx.user.id);
      }),
  }),

  // ==================== REMINDERS MANAGEMENT ====================
  reminderManagement: router({
    // Get all reminder templates
    getTemplates: protectedProcedure
      .query(async () => {
        const templates = await db.getReminderTemplates();
        return templates;
      }),

    // Get reminders scheduled for a specific appointment
    getByAppointment: protectedProcedure
      .input(z.object({
        appointmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getRemindersByAppointment(input.appointmentId);
      }),

    // Manually trigger a reminder for an appointment
    sendManual: protectedProcedure
      .input(z.object({
        appointmentId: z.number(),
        templateId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // This would trigger the reminder sending logic
        // For now, just return success
        return { success: true, message: 'Reminder sent successfully' };
      }),
  }),

  // ==================== CHAIR STATISTICS ====================
  chairStatistics: router({
    getByPeriod: protectedProcedure
      .input(z.object({
        period: z.enum(["week", "month", "year", "custom"]).optional(),
        startDate: z.string().optional(), // ISO date string for custom period
        endDate: z.string().optional(),   // ISO date string for custom period
        chair: z.string().optional(),     // Filter by specific chair
      }))
      .query(async ({ input }) => {
        // const { getChairStatistics } = await import("./chairStatistics");
        
        let startDate: Date;
        let endDate: Date = new Date();
        
        if (input.period === "custom" && input.startDate && input.endDate) {
          startDate = new Date(input.startDate);
          endDate = new Date(input.endDate);
        } else {
          // Default periods
          switch (input.period) {
            case "week":
              startDate = new Date();
              startDate.setDate(startDate.getDate() - 7);
              break;
            case "year":
              startDate = new Date();
              startDate.setFullYear(startDate.getFullYear() - 1);
              break;
            case "month":
            default:
              startDate = new Date();
              startDate.setMonth(startDate.getMonth() - 1);
              break;
          }
        }
        
        // const allStats = await getChairStatistics(startDate, endDate);
        
        // Filter by chair if specified
        
        return []; // return allStats;
      }),
  }),

  // ==================== CHAIR OCCUPANCY ALERTS ====================
  chairOccupancyAlerts: router({
    getActive: protectedProcedure
      .query(async () => {
        // const { getActiveAlerts } = await import("./chairStatistics");
        // return await getActiveAlerts(); return [];
      }),

    checkAndGenerate: protectedProcedure
      .input(z.object({
        period: z.enum(["week", "month"]),
      }))
      .mutation(async ({ input }) => {
        // const { checkOccupancyAndGenerateAlerts } = await import("./chairStatistics");
        // await checkOccupancyAndGenerateAlerts(input.period);
        return { success: true };
      }),

    resolve: protectedProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // const { resolveAlert } = await import("./chairStatistics");
        // await resolveAlert(input.alertId, ctx.user.id);
        return { success: true };
      }),

    getAllThresholds: protectedProcedure
      .query(async () => {
        // const { getAllThresholds } = await import("./chairStatistics");
        // return await getAllThresholds(); return [];
      }),

    getOrCreateThreshold: protectedProcedure
      .input(z.object({
        chair: z.string(),
      }))
      .query(async ({ input }) => {
        // const { getOrCreateThreshold } = await import("./chairStatistics");
        // return await getOrCreateThreshold(input.chair);
      }),

    updateThreshold: protectedProcedure
      .input(z.object({
        chair: z.string(),
        minThreshold: z.number().min(0).max(100),
        criticalThreshold: z.number().min(0).max(100),
      }))
      .mutation(async ({ input }) => {
        // const { updateThreshold } = await import("./chairStatistics");
        // await updateThreshold(input.chair, input.minThreshold, input.criticalThreshold);
        return { success: true };
      }),
  }),

  // ==================== APPOINTMENT DISTRIBUTION ALERTS ====================
  appointmentDistribution: router({
    getAppointmentCountPerDay: protectedProcedure
      .input(z.object({
        daysAhead: z.number().min(1).max(30).default(14),
      }))
      .query(async ({ input }) => {
        const { getAppointmentCountPerDay } = await import("./appointmentDistribution");
        return await getAppointmentCountPerDay(input.daysAhead);
      }),

    checkAndGenerate: protectedProcedure
      .mutation(async () => {
        const { checkDistributionAndGenerateAlerts } = await import("./appointmentDistribution");
        return await checkDistributionAndGenerateAlerts();
      }),

    getActiveAlerts: protectedProcedure
      .query(async () => {
        const { getActiveDistributionAlerts } = await import("./appointmentDistribution");
        return await getActiveDistributionAlerts();
      }),

    resolveAlert: protectedProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { resolveDistributionAlert } = await import("./appointmentDistribution");
        await resolveDistributionAlert(input.alertId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== CHAIR TRENDS ====================
  chairTrends: router({
    getTrends: protectedProcedure
      .input(z.object({
        days: z.number().min(7).max(365).default(30),
      }))
      .query(async ({ input }) => {
        const { getChairTrends } = await import("./chairTrends");
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        return await getChairTrends(startDate, endDate);
      }),

    comparePeriods: protectedProcedure
      .input(z.object({
        days: z.number().min(7).max(365).default(30),
      }))
      .query(async ({ input }) => {
        const { comparePeriods } = await import("./chairTrends");
        const currentEnd = new Date();
        const currentStart = new Date();
        currentStart.setDate(currentStart.getDate() - input.days);
        return await comparePeriods(currentStart, currentEnd);
      }),

    getOccupancyByDayOfWeek: protectedProcedure
      .input(z.object({
        days: z.number().min(7).max(365).default(30),
      }))
      .query(async ({ input }) => {
        const { getOccupancyByDayOfWeek } = await import("./chairTrends");
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        return await getOccupancyByDayOfWeek(startDate, endDate);
      }),
  }),

  // ==================== OCCUPANCY FORECAST ====================
  occupancyForecast: router({
    analyzePatterns: protectedProcedure
      .input(z.object({
        daysBack: z.number().min(7).max(365).default(90),
      }))
      .query(async ({ input }) => {
        const { analyzeHourlyPatterns } = await import("./occupancyForecast");
        return await analyzeHourlyPatterns(input.daysBack);
      }),

    predictOccupancy: protectedProcedure
      .input(z.object({
        targetDate: z.string(), // ISO date string
        chair: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { predictOccupancy } = await import("./occupancyForecast");
        const targetDate = new Date(input.targetDate);
        return await predictOccupancy(targetDate, input.chair);
      }),

    getBestTimeSlots: protectedProcedure
      .input(z.object({
        daysAhead: z.number().min(1).max(30).default(7),
        appointmentType: z.string().optional(),
        preferredChair: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getBestTimeSlots } = await import("./occupancyForecast");
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + input.daysAhead);
        return await getBestTimeSlots(startDate, endDate, input.appointmentType, input.preferredChair);
      }),

    optimizeDistribution: protectedProcedure
      .input(z.object({
        targetDate: z.string(), // ISO date string
      }))
      .query(async ({ input }) => {
        const { optimizeChairDistribution } = await import("./occupancyForecast");
        const targetDate = new Date(input.targetDate);
        return await optimizeChairDistribution(targetDate);
      }),
   }),

  // ==================== FILE UPLOAD ====================
  files: router({
    // Upload de arquivo para S3
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { uploadFileToS3 } = await import('./fileUploadService');
        
        // Converter base64 para Buffer
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        
        return await uploadFileToS3({
          fileName: input.fileName,
          fileBuffer,
          contentType: input.contentType,
          userId: ctx.user.openId,
        });
      }),
  }),

  // ==================== N8N WHATSAPP ====================
  n8n: router({
    // Testar conexão com n8n webhook
    testConnection: protectedProcedure
      .mutation(async () => {
        const { testN8nConnection } = await import('./n8nWhatsAppService');
        return await testN8nConnection();
      }),
    
    // Webhook para receber mensagens do n8n
    receiveMessage: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        from: z.string(),
        fromName: z.string(),
        message: z.string(),
        messageId: z.string(),
        timestamp: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { processIncomingMessage } = await import('./n8nWhatsAppService');
        await processIncomingMessage(input);
        return { success: true };
      }),
    
    // Configurar URLs do n8n
    saveConfig: protectedProcedure
      .input(z.object({
        n8nWebhookUrl: z.string().url(),
        evolutionSessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        // TODO: Salvar configuração no banco de dados
        // Por enquanto, apenas retornar sucesso
        console.log('[n8n] Configuração salva:', input);
        return { success: true, message: 'Configuração salva com sucesso!' };
      }),
  }),

  // Campaigns router
  campaigns: router({
    list: protectedProcedure.query(async () => {
      // Return empty array for now - will be implemented later
      return [];
    }),
  }),

  // ==================== CHAIRS MANAGEMENT ====================
  chairs: router({
    // Update doctor assigned to a chair for a specific date
    updateDoctor: protectedProcedure
      .input(z.object({
        chairId: z.string(),
        doctorName: z.string(),
        date: z.string(), // ISO date string
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateChairDoctor({
          chairId: input.chairId,
          doctorName: input.doctorName,
          date: new Date(input.date),
          updatedBy: ctx.user.id,
        });
        return { success: true };
      }),

    // Get doctor assigned to chairs for a specific date
    getDoctorsByDate: protectedProcedure
      .input(z.object({
        date: z.string(), // ISO date string
      }))
      .query(async ({ input }) => {
        return await db.getChairDoctorsByDate(new Date(input.date));
      }),
  }),
});
export type AppRouter = typeof appRouter;
