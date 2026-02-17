/**
 * Router para processar mensagens do WhatsApp recebidas via Evolution API
 * Integra com o sistema de detecção de confirmações e reagendamentos
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { isConfirmationMessage, isRescheduleRequest } from '../confirmationDetectorService';
import * as db from '../db';

// Schema para validar mensagens recebidas do Evolution API via webhook
const evolutionWebhookSchema = z.object({
  phone: z.string(), // Telefone do paciente (formato: 595985360602)
  message: z.string(), // Mensagem enviada pelo paciente
  timestamp: z.number().optional(), // Timestamp da mensagem
});

export const whatsappWebhookRouter = router({
  /**
   * Endpoint para processar mensagens recebidas do WhatsApp via Evolution API
   * POST /api/trpc/whatsappWebhook.processMessage
   */
  processMessage: publicProcedure
    .input(evolutionWebhookSchema)
    .mutation(async ({ input }) => {
      const { phone, message } = input;

      console.log(`[WhatsAppWebhook] Mensagem recebida de ${phone}: "${message}"`);

      // Buscar paciente pelo telefone
      const patient = await db.getPatientByPhone(phone);

      if (!patient) {
        console.log(`[WhatsAppWebhook] Paciente não encontrado: ${phone}`);
        return {
          success: false,
          error: 'Paciente não encontrado',
        };
      }

      console.log(`[WhatsAppWebhook] Paciente encontrado: ${patient.name} (ID: ${patient.id})`);

      // Detectar tipo de resposta (confirmação ou reagendamento)
      const isConfirmed = isConfirmationMessage(message);
      const needsReschedule = isRescheduleRequest(message) && !isConfirmed;

      console.log(`[WhatsAppWebhook] Detecção: isConfirmed=${isConfirmed}, needsReschedule=${needsReschedule}`);

      if (isConfirmed) {
        // CONFIRMAÇÃO DETECTADA
        console.log(`[WhatsAppWebhook] ✅ Confirmação detectada de ${patient.name}`);

        // Buscar consultas futuras do paciente
        const futureAppointments = await db.getAppointmentsByPatientId(patient.id);
        const now = new Date();
        const pendingAppointments = futureAppointments.filter(
          (apt) => new Date(apt.appointmentDate) > now && apt.status === 'scheduled'
        );

        if (pendingAppointments.length > 0) {
          // Marcar a próxima consulta como confirmada
          const nextAppointment = pendingAppointments[0];
          
          await db.updateAppointment(nextAppointment.id, {
            status: 'confirmed',
            confirmedAt: new Date(),
          });

          console.log(`[WhatsAppWebhook] Consulta ${nextAppointment.id} confirmada`);

          return {
            success: true,
            action: 'confirmed',
            patientName: patient.name,
            appointmentId: nextAppointment.id,
          };
        } else {
          console.log(`[WhatsAppWebhook] Nenhuma consulta pendente para ${patient.name}`);
          return {
            success: true,
            action: 'no_pending_appointments',
            patientName: patient.name,
          };
        }
      } else if (needsReschedule) {
        // REAGENDAMENTO DETECTADO
        console.log(`[WhatsAppWebhook] 📅 Solicitação de reagendamento detectada de ${patient.name}`);

        // 1. Criar alerta de reagendamento no Dashboard
        await db.createRescheduleAlert({
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: phone,
          message: message,
          timestamp: new Date(),
        });

        console.log(`[WhatsAppWebhook] Alerta de reagendamento criado para ${patient.name}`);

        // 2. TODO: Enviar resposta automática ao paciente via Evolution API
        // const autoReplyMessage = `La secretaria te escribe ahora para reagendarte. Gracias, ${patient.name}.`;

        // 3. TODO: Enviar notificação ao WhatsApp corporativo
        console.log(`[WhatsAppWebhook] TODO: Enviar resposta automática e notificação corporativa`);

        return {
          success: true,
          action: 'reschedule_requested',
          patientName: patient.name,
          alertCreated: true,
        };
      } else {
        // Mensagem não reconhecida
        console.log(`[WhatsAppWebhook] Mensagem não reconhecida de ${patient.name}: "${message}"`);

        return {
          success: true,
          action: 'message_not_recognized',
          patientName: patient.name,
        };
      }
    }),
});
