/**
 * tRPC Router para integração N8N + Evolution API
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import {
  sendMessageViaN8N,
  sendBatchMessagesViaN8N,
  testN8NConnection,
  sendAutomaticReminder,
  type SendMessagePayload,
} from '../n8nEvolutionService';

export const n8nRouter = router({
  /**
   * Testa conexão com N8N webhook
   */
  testConnection: publicProcedure.query(async () => {
    return testN8NConnection();
  }),

  /**
   * Envia mensagem única via N8N
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        number: z.string().min(1, 'Número de telefone é obrigatório'),
        message: z.string().min(1, 'Mensagem é obrigatória'),
        patientName: z.string().optional(),
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const payload: SendMessagePayload = {
        number: input.number,
        message: input.message,
        patientName: input.patientName,
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
      };

      return sendMessageViaN8N(payload);
    }),

  /**
   * Envia mensagens em lote
   */
  sendBatchMessages: protectedProcedure
    .input(
      z.array(
        z.object({
          number: z.string().min(1),
          message: z.string().min(1),
          patientName: z.string().optional(),
          appointmentDate: z.string().optional(),
          appointmentTime: z.string().optional(),
        })
      )
    )
    .mutation(async ({ input }) => {
      const payloads: SendMessagePayload[] = input.map((msg) => ({
        number: msg.number,
        message: msg.message,
        patientName: msg.patientName,
        appointmentDate: msg.appointmentDate,
        appointmentTime: msg.appointmentTime,
      }));

      const results = await sendBatchMessagesViaN8N(payloads);

      return {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    }),

  /**
   * Envia recordatório automático
   */
  sendReminder: protectedProcedure
    .input(
      z.object({
        patientPhone: z.string().min(1, 'Telefone do paciente é obrigatório'),
        patientName: z.string().min(1, 'Nome do paciente é obrigatório'),
        appointmentDate: z.string().min(1, 'Data do agendamento é obrigatória'),
        appointmentTime: z.string().min(1, 'Hora do agendamento é obrigatória'),
      })
    )
    .mutation(async ({ input }) => {
      return sendAutomaticReminder(
        input.patientPhone,
        input.patientName,
        input.appointmentDate,
        input.appointmentTime
      );
    }),

  /**
   * Envia recordatórios para múltiplos pacientes
   */
  sendBatchReminders: protectedProcedure
    .input(
      z.array(
        z.object({
          patientPhone: z.string().min(1),
          patientName: z.string().min(1),
          appointmentDate: z.string().min(1),
          appointmentTime: z.string().min(1),
        })
      )
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.map((reminder) =>
          sendAutomaticReminder(
            reminder.patientPhone,
            reminder.patientName,
            reminder.appointmentDate,
            reminder.appointmentTime
          )
        )
      );

      return {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    }),

  /**
   * Obtém status da integração N8N
   */
  getStatus: publicProcedure.query(async () => {
    const connection = await testN8NConnection();

    return {
      n8n: {
        connected: connection.success,
        webhookUrl: connection.webhookUrl,
        lastCheck: new Date(connection.timestamp).toISOString(),
      },
      evolution: {
        apiKey: process.env.EVOLUTION_API_KEY ? '***' : 'não configurada',
        baseUrl: process.env.EVOLUTION_API_URL || 'http://95.111.240.243:8080',
      },
    };
  }),
});
