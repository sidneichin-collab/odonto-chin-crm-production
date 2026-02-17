/**
 * Post-Attendance Scheduler Service
 * 
 * Envia mensagens de agradecimento 2h APÓS cada consulta
 * APENAS para pacientes CONFIRMADOS
 * APENAS no dia da consulta
 * 
 * Roda a cada 5 minutos verificando quais pacientes precisam receber
 */

import { getAppointmentsByDateRange, getPatientById } from './db';
import { sendMessage } from './evolutionApiService';
import { getGreeting } from './greetingUtils';
import { getReminderTemplate } from './hourlyReminderTemplates';
import { ENV } from './_core/env';

interface PostAttendanceJob {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentTime: string;
  appointmentDate: Date;
  sendTime: Date;
  status: 'pending' | 'sent' | 'failed';
}

class PostAttendanceScheduler {
  private jobs: Map<string, PostAttendanceJob> = new Map();
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia o scheduler para verificar pós-atendimento a cada 5 minutos
   */
  start() {
    if (this.isRunning) {
      console.log('[PostAttendanceScheduler] ⚠️  Scheduler já está rodando');
      return;
    }

    console.log('[PostAttendanceScheduler] 🚀 Iniciando scheduler (verifica a cada 5 minutos)...');
    this.isRunning = true;

    // Executar imediatamente
    this.checkAndSendPostAttendance();

    // Depois a cada 5 minutos
    this.checkInterval = setInterval(() => {
      this.checkAndSendPostAttendance();
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('[PostAttendanceScheduler] ⏹️  Scheduler parado');
  }

  /**
   * Verifica e envia mensagens pós-atendimento para pacientes que precisam
   */
  private async checkAndSendPostAttendance() {
    try {
      const now = new Date();
      const hour = now.getHours();

      // PARAR às 19h (regra crítica)
      if (hour >= 19) {
        console.log('[PostAttendanceScheduler] ⏹️  Parado às 19h (regra crítica)');
        return;
      }

      console.log(`[PostAttendanceScheduler] ⏱️  Verificando pós-atendimento em ${now.toLocaleString('es-PY')}`);

      // Buscar todos os compromissos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await getAppointmentsByDateRange(today, tomorrow);

      // Filtrar CONFIRMADOS
      const confirmedAppointments = appointments.filter(
        (apt) => apt.status === 'confirmed'
      );

      console.log(`[PostAttendanceScheduler] 📋 Total confirmados: ${confirmedAppointments.length}`);

      let sentCount = 0;
      let failedCount = 0;

      for (const apt of confirmedAppointments as any[]) {
        try {
          const appointmentDate = new Date(apt.appointmentDate);
          const appointmentHour = appointmentDate.getHours();
          const appointmentMinutes = appointmentDate.getMinutes();

          // Calcular horário de envio (2h APÓS)
          const sendTime = new Date(appointmentDate);
          sendTime.setHours(sendTime.getHours() + 2);

          const sendHour = sendTime.getHours();
          const sendMinutes = sendTime.getMinutes();

          // Verificar se é hora de enviar (margem de 5 minutos)
          const timeDiff = Math.abs(now.getTime() - sendTime.getTime());
          const isTimeToSend = timeDiff < 5 * 60 * 1000; // 5 minutos de margem

          if (!isTimeToSend) {
            console.log(
              `[PostAttendanceScheduler] ⏳ ${apt.patientName}: Aguardando ${sendHour}:${String(sendMinutes).padStart(2, '0')} (consulta ${appointmentHour}:${String(appointmentMinutes).padStart(2, '0')})`
            );
            continue;
          }

          // Verificar se já foi enviado
          const jobKey = `${apt.id}-postattendance`;
          if (this.jobs.has(jobKey) && this.jobs.get(jobKey)?.status === 'sent') {
            console.log(
              `[PostAttendanceScheduler] ✅ ${apt.patientName}: Já foi enviado`
            );
            continue;
          }

          // VALIDAÇÃO CRÍTICA 1: Verificar confirmação
          if (apt.status !== 'confirmed') {
            console.log(
              `[PostAttendanceScheduler] ❌ ${apt.patientName}: NÃO CONFIRMADO (bloqueado)`
            );
            failedCount++;
            continue;
          }

          // VALIDAÇÃO CRÍTICA 2: Verificar se é o dia da consulta
          const appointmentDay = new Date(appointmentDate);
          appointmentDay.setHours(0, 0, 0, 0);
          const todayCheck = new Date();
          todayCheck.setHours(0, 0, 0, 0);

          if (appointmentDay.getTime() !== todayCheck.getTime()) {
            console.log(
              `[PostAttendanceScheduler] ❌ ${apt.patientName}: NÃO É O DIA DA CONSULTA (bloqueado)`
            );
            failedCount++;
            continue;
          }

          // VALIDAÇÃO CRÍTICA 3: Verificar se é 2h após (margem de 30 min)
          const twoHoursAfter = new Date(appointmentDate.getTime() + 2 * 60 * 60 * 1000);
          const timeDiffFromTarget = Math.abs(now.getTime() - twoHoursAfter.getTime());

          if (timeDiffFromTarget > 30 * 60 * 1000) { // 30 minutos de margem
            console.log(
              `[PostAttendanceScheduler] ⏳ ${apt.patientName}: Aguardando 2h após (${twoHoursAfter.toLocaleTimeString('es-PY')})`
            );
            continue;
          }

          // Buscar dados do paciente
          const patient = await getPatientById(apt.patientId);
          if (!patient || !patient.phone) {
            console.error(
              `[PostAttendanceScheduler] ❌ ${apt.patientName}: Paciente não encontrado ou sem telefone`
            );
            failedCount++;
            continue;
          }

          // Obter saudação dinâmica
          const greeting = getGreeting(apt.patientName);

          // Preparar mensagem usando template pós-atendimento
          const template = getReminderTemplate('post_attendance');
          const message = template ? template.message.replace(/{patientName}/g, apt.patientName) : `Gracias por tu visita, ${apt.patientName}!`;

          // Adicionar saudação personalizada no início
          const fullMessage = `${greeting}\n\n${message}`;

          // Enviar mensagem via WhatsApp
          try {
            await sendMessage(
              process.env.EVOLUTION_INSTANCE_NAME || 'default',
              patient.phone,
              fullMessage,
              process.env.EVOLUTION_API_URL || '',
              process.env.EVOLUTION_API_KEY || ''
            );

            sentCount++;
            console.log(
              `[PostAttendanceScheduler] ✅ Pós-atendimento enviado para ${apt.patientName} (2h após)`
            );

            // Marcar como enviado
            this.jobs.set(jobKey, {
              appointmentId: apt.id,
              patientId: apt.patientId,
              patientName: apt.patientName,
              patientPhone: patient.phone,
              appointmentTime: `${appointmentHour}:${String(appointmentMinutes).padStart(2, '0')}`,
              appointmentDate,
              sendTime,
              status: 'sent',
            });
          } catch (sendError: any) {
            failedCount++;
            console.error(
              `[PostAttendanceScheduler] ❌ Erro ao enviar para ${apt.patientName}: ${sendError.message}`
            );

            this.jobs.set(jobKey, {
              appointmentId: apt.id,
              patientId: apt.patientId,
              patientName: apt.patientName,
              patientPhone: patient.phone,
              appointmentTime: `${appointmentHour}:${String(appointmentMinutes).padStart(2, '0')}`,
              appointmentDate,
              sendTime,
              status: 'failed',
            });
          }
        } catch (error: any) {
          failedCount++;
          console.error(
            `[PostAttendanceScheduler] ❌ Erro ao processar ${apt.patientName}: ${error.message}`
          );
        }
      }

      if (sentCount > 0 || failedCount > 0) {
        console.log(
          `[PostAttendanceScheduler] 📊 Resultado: ${sentCount} enviadas, ${failedCount} falhadas`
        );
      } else {
        console.log(
          `[PostAttendanceScheduler] ✅ Nenhuma mensagem pós-atendimento para enviar (nenhum confirmado no horário)`
        );
      }
    } catch (error: any) {
      console.error('[PostAttendanceScheduler] ❌ Erro ao verificar pós-atendimento:', error);
    }
  }

  /**
   * Retorna status do scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalJobs: this.jobs.size,
      sentJobs: Array.from(this.jobs.values()).filter((j) => j.status === 'sent').length,
      failedJobs: Array.from(this.jobs.values()).filter((j) => j.status === 'failed').length,
      pendingJobs: Array.from(this.jobs.values()).filter((j) => j.status === 'pending').length,
    };
  }

  /**
   * Retorna relatório detalhado
   */
  getReport() {
    return {
      status: this.getStatus(),
      jobs: Array.from(this.jobs.values()).map((job) => ({
        patientName: job.patientName,
        appointmentTime: job.appointmentTime,
        sendTime: job.sendTime.toLocaleString('es-PY'),
        status: job.status,
      })),
    };
  }
}

// Exportar instância singleton
export const postAttendanceScheduler = new PostAttendanceScheduler();
