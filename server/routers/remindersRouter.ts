/**
 * Reminders Router
 * tRPC procedures para sistema de recordatórios WhatsApp
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { reminderQueue, reminderResponses, whatsappNumbers, appointments, patients } from '../../drizzle/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import * as reminders from '../reminders';
import * as evolutionApi from '../evolution-api';

export const remindersRouter = router({
  // ==================== AGENDAMENTO ====================
  
  /**
   * Agendar recordatórios para um agendamento
   */
  scheduleReminders: protectedProcedure
    .input(z.object({
      appointmentId: z.number()
    }))
    .mutation(async ({ input }) => {
      try {
        await reminders.scheduleReminders(input.appointmentId);
        return { success: true, message: 'Recordatórios agendados com sucesso' };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erro ao agendar recordatórios'
        });
      }
    }),

  /**
   * Cancelar recordatórios pendentes de um agendamento
   */
  cancelReminders: protectedProcedure
    .input(z.object({
      appointmentId: z.number()
    }))
    .mutation(async ({ input }) => {
      try {
        await reminders.cancelPendingReminders(input.appointmentId);
        return { success: true, message: 'Recordatórios cancelados com sucesso' };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erro ao cancelar recordatórios'
        });
      }
    }),

  // ==================== CONSULTAS ====================

  /**
   * Buscar recordatórios pendentes
   */
  getPendingReminders: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const results = await db
        .select({
          id: reminderQueue.id,
          appointmentId: reminderQueue.appointmentId,
          patientId: reminderQueue.patientId,
          patientName: patients.name,
          patientPhone: patients.phone,
          appointmentDate: appointments.appointmentDate,
          appointmentTime: appointments.appointmentTime,
          reminderType: reminderQueue.reminderType,
          scheduledAt: reminderQueue.scheduledAt,
          status: reminderQueue.status,
          whatsappNumber: reminderQueue.whatsappNumber
        })
        .from(reminderQueue)
        .leftJoin(patients, eq(reminderQueue.patientId, patients.id))
        .leftJoin(appointments, eq(reminderQueue.appointmentId, appointments.id))
        .where(eq(reminderQueue.status, 'pending'))
        .orderBy(reminderQueue.scheduledAt)
        .limit(input.limit);

      return results;
    }),

  /**
   * Buscar estatísticas de recordatórios
   */
  getReminderStats: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Total por status
      const statusStats = await db
        .select({
          status: reminderQueue.status,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(reminderQueue)
        .groupBy(reminderQueue.status);

      // Total de respostas por intent
      const intentStats = await db
        .select({
          intent: reminderResponses.detectedIntent,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(reminderResponses)
        .groupBy(reminderResponses.detectedIntent);

      // Uso de números WhatsApp hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 19).replace('T', ' ');

      const numberUsage = await db
        .select({
          whatsappNumber: reminderQueue.whatsappNumber,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(reminderQueue)
        .where(and(
          gte(reminderQueue.sentAt, todayStr),
          eq(reminderQueue.status, 'sent')
        ))
        .groupBy(reminderQueue.whatsappNumber);

      return {
        statusStats,
        intentStats,
        numberUsage
      };
    }),

  /**
   * Buscar histórico de respostas
   */
  getReminderResponses: protectedProcedure
    .input(z.object({
      appointmentId: z.number().optional(),
      patientId: z.number().optional(),
      limit: z.number().optional().default(50)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      let query = db
        .select({
          id: reminderResponses.id,
          appointmentId: reminderResponses.appointmentId,
          patientId: reminderResponses.patientId,
          patientName: patients.name,
          messageText: reminderResponses.messageText,
          detectedIntent: reminderResponses.detectedIntent,
          detectedKeywords: reminderResponses.detectedKeywords,
          receivedAt: reminderResponses.receivedAt,
          processed: reminderResponses.processed
        })
        .from(reminderResponses)
        .leftJoin(patients, eq(reminderResponses.patientId, patients.id))
        .orderBy(desc(reminderResponses.receivedAt))
        .limit(input.limit);

      if (input.appointmentId) {
        query = query.where(eq(reminderResponses.appointmentId, input.appointmentId)) as any;
      } else if (input.patientId) {
        query = query.where(eq(reminderResponses.patientId, input.patientId)) as any;
      }

      const results = await query;
      return results;
    }),

  // ==================== NÚMEROS WHATSAPP ====================

  /**
   * Listar números WhatsApp
   */
  getWhatsAppNumbers: protectedProcedure
    .input(z.object({
      channelType: z.enum(['integration', 'reminders']).optional(),
      country: z.string().optional()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      let query = db.select().from(whatsappNumbers);

      const conditions = [];
      if (input.channelType) {
        conditions.push(eq(whatsappNumbers.channelType, input.channelType));
      }
      if (input.country) {
        conditions.push(eq(whatsappNumbers.country, input.country));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query;
      return results;
    }),

  /**
   * Adicionar número WhatsApp
   */
  addWhatsAppNumber: protectedProcedure
    .input(z.object({
      numberName: z.string(),
      phoneNumber: z.string(),
      country: z.string(),
      channelType: z.enum(['integration', 'reminders']),
      instanceName: z.string(),
      dailyLimit: z.number().optional().default(1000)
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Validar número
      if (!evolutionApi.isValidPhoneNumber(input.phoneNumber)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Número de telefone inválido'
        });
      }

      // Criar instância na Evolution API
      try {
        await evolutionApi.createInstance(input.instanceName);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao criar instância: ${error.message}`
        });
      }

      // Inserir no banco
      const [result] = await db.insert(whatsappNumbers).values({
        numberName: input.numberName,
        phoneNumber: evolutionApi.formatPhoneNumber(input.phoneNumber),
        country: input.country,
        channelType: input.channelType,
        instanceName: input.instanceName,
        dailyLimit: input.dailyLimit,
        status: 'inactive' // Será 'active' após escanear QR Code
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Obter QR Code para autenticação
   */
  getQRCode: protectedProcedure
    .input(z.object({
      instanceName: z.string()
    }))
    .query(async ({ input }) => {
      try {
        const qrData = await evolutionApi.getQRCode(input.instanceName);
        return qrData;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao obter QR Code: ${error.message}`
        });
      }
    }),

  /**
   * Verificar status de conexão
   */
  getInstanceStatus: protectedProcedure
    .input(z.object({
      instanceName: z.string()
    }))
    .query(async ({ input }) => {
      try {
        const status = await evolutionApi.getInstanceStatus(input.instanceName);
        
        // Atualizar status no banco
        const db = await getDb();
        if (db) {
          const isConnected = status.state === 'open';
          await db
            .update(whatsappNumbers)
            .set({ 
              status: isConnected ? 'active' : 'inactive',
              lastUsedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
            .where(eq(whatsappNumbers.instanceName, input.instanceName));
        }
        
        return status;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao verificar status: ${error.message}`
        });
      }
    }),

  /**
   * Desconectar número WhatsApp
   */
  disconnectNumber: protectedProcedure
    .input(z.object({
      instanceName: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await evolutionApi.logoutInstance(input.instanceName);
        
        // Atualizar status no banco
        const db = await getDb();
        if (db) {
          await db
            .update(whatsappNumbers)
            .set({ status: 'inactive' })
            .where(eq(whatsappNumbers.instanceName, input.instanceName));
        }
        
        return { success: true, message: 'Número desconectado com sucesso' };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao desconectar: ${error.message}`
        });
      }
    }),

  /**
   * Remover número WhatsApp
   */
  removeNumber: protectedProcedure
    .input(z.object({
      id: z.number(),
      instanceName: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        // Deletar instância da Evolution API
        await evolutionApi.deleteInstance(input.instanceName);
        
        // Remover do banco
        const db = await getDb();
        if (db) {
          await db
            .delete(whatsappNumbers)
            .where(eq(whatsappNumbers.id, input.id));
        }
        
        return { success: true, message: 'Número removido com sucesso' };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao remover número: ${error.message}`
        });
      }
    }),

  // ==================== ENVIO MANUAL ====================

  /**
   * Enviar mensagem de teste
   */
  sendTestMessage: protectedProcedure
    .input(z.object({
      instanceName: z.string(),
      phoneNumber: z.string(),
      message: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await evolutionApi.sendWhatsAppMessage(input.instanceName, {
          number: evolutionApi.formatPhoneNumber(input.phoneNumber),
          text: input.message
        });
        
        return { success: true, messageId: result.key.id };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao enviar mensagem: ${error.message}`
        });
      }
    }),

  // ==================== DASHBOARD MONITORING ====================

  /**
   * Estatísticas simplificadas para dashboard
   */
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

      // Total enviados (últimos 7 dias)
      const sentResult = await db
        .select({ count: sql<number>`COUNT(*)`.as('count') })
        .from(reminderQueue)
        .where(and(
          eq(reminderQueue.status, 'sent'),
          gte(reminderQueue.sentAt, sevenDaysAgoStr)
        ));
      const sent = sentResult[0]?.count || 0;

      // Total pendentes
      const pendingResult = await db
        .select({ count: sql<number>`COUNT(*)`.as('count') })
        .from(reminderQueue)
        .where(eq(reminderQueue.status, 'pending'));
      const pending = pendingResult[0]?.count || 0;

      // Total falhados (últimos 7 dias)
      const failedResult = await db
        .select({ count: sql<number>`COUNT(*)`.as('count') })
        .from(reminderQueue)
        .where(and(
          eq(reminderQueue.status, 'failed'),
          gte(reminderQueue.sentAt, sevenDaysAgoStr)
        ));
      const failed = failedResult[0]?.count || 0;

      // Taxa de confirmação (últimos 7 dias)
      const confirmedResult = await db
        .select({ count: sql<number>`COUNT(*)`.as('count') })
        .from(reminderResponses)
        .where(and(
          eq(reminderResponses.detectedIntent, 'confirmed'),
          gte(reminderResponses.receivedAt, sevenDaysAgoStr)
        ));
      const confirmed = confirmedResult[0]?.count || 0;
      const confirmationRate = sent > 0 ? (confirmed / sent) * 100 : 0;

      // No contestaron (sin respuesta)
      const noAnswer = sent - confirmed - failed;

      // Reagendar (detectar intent 'reschedule')
      const rescheduleResult = await db
        .select({ count: sql<number>`COUNT(*)`.as('count') })
        .from(reminderResponses)
        .where(and(
          eq(reminderResponses.detectedIntent, 'reschedule'),
          gte(reminderResponses.receivedAt, sevenDaysAgoStr)
        ));
      const reschedule = rescheduleResult[0]?.count || 0;

      return {
        sent,
        pending,
        failed,
        confirmed,
        noAnswer: noAnswer > 0 ? noAnswer : 0,
        reschedule,
        confirmationRate
      };
    }),

  /**
   * Fila de mensagens programadas
   */
  getQueue: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const results = await db
        .select({
          id: reminderQueue.id,
          patientName: patients.name,
          phone: patients.phone,
          messageType: reminderQueue.reminderType,
          scheduledFor: reminderQueue.scheduledAt,
          status: reminderQueue.status
        })
        .from(reminderQueue)
        .leftJoin(patients, eq(reminderQueue.patientId, patients.id))
        .where(eq(reminderQueue.status, 'pending'))
        .orderBy(reminderQueue.scheduledAt)
        .limit(20);

      return results;
    }),

  /**
   * Buscar pacientes por status de recordatório
   */
  getPatientsByStatus: protectedProcedure
    .input(z.object({
      status: z.enum(['sent', 'pending', 'failed', 'confirmed'])
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Para status 'confirmed', buscar em reminderResponses
      if (input.status === 'confirmed') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

        const results = await db
          .select({
            id: patients.id,
            name: patients.name,
            phone: patients.phone,
            email: patients.email,
            appointmentId: appointments.id,
            appointmentDate: appointments.appointmentDate,
            appointmentTime: appointments.appointmentTime,
            chair: appointments.chair,
            confirmedAt: reminderResponses.receivedAt
          })
          .from(reminderResponses)
          .leftJoin(patients, eq(reminderResponses.patientId, patients.id))
          .leftJoin(appointments, eq(reminderResponses.appointmentId, appointments.id))
          .where(and(
            eq(reminderResponses.detectedIntent, 'confirmed'),
            gte(reminderResponses.receivedAt, sevenDaysAgoStr)
          ))
          .orderBy(desc(reminderResponses.receivedAt))
          .limit(100);

        return results;
      }

      // Para outros status, buscar em reminderQueue
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

      let whereCondition;
      if (input.status === 'pending') {
        whereCondition = eq(reminderQueue.status, 'pending');
      } else if (input.status === 'sent') {
        whereCondition = and(
          eq(reminderQueue.status, 'sent'),
          gte(reminderQueue.sentAt, sevenDaysAgoStr)
        );
      } else if (input.status === 'failed') {
        whereCondition = and(
          eq(reminderQueue.status, 'failed'),
          gte(reminderQueue.sentAt, sevenDaysAgoStr)
        );
      }

      const results = await db
        .select({
          id: patients.id,
          name: patients.name,
          phone: patients.phone,
          email: patients.email,
          appointmentId: appointments.id,
          appointmentDate: appointments.appointmentDate,
          appointmentTime: appointments.appointmentTime,
          chair: appointments.chair,
          reminderStatus: reminderQueue.status,
          scheduledAt: reminderQueue.scheduledAt,
          sentAt: reminderQueue.sentAt
        })
        .from(reminderQueue)
        .leftJoin(patients, eq(reminderQueue.patientId, patients.id))
        .leftJoin(appointments, eq(reminderQueue.appointmentId, appointments.id))
        .where(whereCondition)
        .orderBy(desc(reminderQueue.scheduledAt))
        .limit(100);

      return results;
    }),

  /**
   * Canais WhatsApp com uso diário
   */
  getChannels: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const results = await db
        .select({
          id: whatsappNumbers.id,
          instanceName: whatsappNumbers.instanceName,
          country: whatsappNumbers.country,
          status: whatsappNumbers.status,
          dailyMessageCount: whatsappNumbers.dailyMessageCount,
          dailyLimit: whatsappNumbers.dailyLimit
        })
        .from(whatsappNumbers)
        .where(eq(whatsappNumbers.channelType, 'reminders'));

      return results;
    }),

});
