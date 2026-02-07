import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";

// Default tenant ID for standalone mode (no multi-tenancy)
const DEFAULT_TENANT_ID = 1;

export const appRouter = router({
  // Dashboard endpoints
  dashboard: {
    getStats: publicProcedure.query(async () => {
      const stats = await db.getDashboardStats(DEFAULT_TENANT_ID);
      return stats;
    }),
    getStatsByDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }: { input: { date: string } }) => {
        const stats = await db.getDashboardStatsByDate(DEFAULT_TENANT_ID, input.date);
        return stats;
      }),
  },

  // Patient endpoints
  patients: {
    list: publicProcedure.query(async () => {
      const patients = await db.getPatientsByTenant(DEFAULT_TENANT_ID);
      return patients;
    }),
    create: publicProcedure
      .input(z.object({
        nombre: z.string(),
        telefono: z.string(),
        email: z.string().optional(),
        fechaNacimiento: z.string().optional(),
      }))
      .mutation(async ({ input }: any) => {
        const patient = await db.createPatient({
          ...input,
          tenantId: DEFAULT_TENANT_ID,
        });
        return patient;
      }),
    atRisk: publicProcedure.query(async () => {
      const patients = await db.getAtRiskPatients(DEFAULT_TENANT_ID);
      return patients;
    }),
  },

  // Appointment endpoints
  appointments: {
    list: publicProcedure.query(async () => {
      const appointments = await db.getAppointmentsByTenant(DEFAULT_TENANT_ID);
      return appointments;
    }),
    today: publicProcedure.query(async () => {
      const appointments = await db.getTodayAppointments(DEFAULT_TENANT_ID);
      return appointments;
    }),
    create: publicProcedure
      .input(z.object({
        patientId: z.number(),
        fecha: z.string(),
        hora: z.string(),
        tipo: z.enum(["Ortodontia", "Clinico General"]),
        estado: z.enum(["Pendiente", "Confirmada", "Completada", "Cancelada"]).optional(),
      }))
      .mutation(async ({ input }: any) => {
        const appointment = await db.createAppointment({
          ...input,
          tenantId: DEFAULT_TENANT_ID,
          estado: input.estado || "Pendiente",
        });
        return appointment;
      }),
  },

  // Waiting list endpoints
  waitingList: {
    list: publicProcedure.query(async () => {
      const list = await db.getWaitingListByTenant(DEFAULT_TENANT_ID);
      return list;
    }),
    add: publicProcedure
      .input(z.object({
        patientId: z.number(),
        prioridad: z.enum(["Alta", "Media", "Baja"]),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }: any) => {
        const entry = await db.addToWaitingList({
          ...input,
          tenantId: DEFAULT_TENANT_ID,
        });
        return entry;
      }),
  },
});

export type AppRouter = typeof appRouter;
