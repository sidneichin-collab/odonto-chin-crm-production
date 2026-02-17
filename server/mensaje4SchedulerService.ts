/**
 * Mensaje 4 Scheduler Service
 * 
 * Envia Mensaje 4 (Aviso final) exatamente 3h ANTES de cada consulta
 * APENAS para pacientes NÃO-CONFIRMADOS
 * 
 * Roda a cada 5 minutos verificando quais pacientes precisam receber
 */

import { getAppointmentsByDateRange, getPatientById } from './db';
import { sendMessage } from './evolutionApiService';
import { getGreeting } from './greetingUtils';
import { escalatingFirmnessTemplates, formatTemplate } from './escalatingFirmnessTemplates';
import { ENV } from './_core/env';

interface Mensaje4Job {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentTime: string;
  appointmentDate: Date;
  sendTime: Date;
  status: 'pending' | 'sent' | 'failed';
}

class Mensaje4Scheduler {
  private jobs: Map<string, Mensaje4Job> = new Map();
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia o scheduler para verificar Mensaje 4 a cada 5 minutos
   */
  start() {
    if (this.isRunning) {
      console.log('[Mensaje4Scheduler] ⚠️  Scheduler já está rodando');
      return;
    }

    console.log('[Mensaje4Scheduler] 🚀 Iniciando scheduler (verifica a cada 5 minutos)...');
    this.isRunning = true;

    // Executar imediatamente
    this.checkAndSendMensaje4();

    // Depois a cada 5 minutos
    this.checkInterval = setInterval(() => {
      this.checkAndSendMensaje4();
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
    console.log('[Mensaje4Scheduler] ⏹️  Scheduler parado');
  }

  /**
   * Verifica e envia Mensaje 4 para pacientes que precisam
   */
  private async checkAndSendMensaje4() {
    try {
      const now = new Date();
      const hour = now.getHours();

      // PARAR às 19h (regra crítica)
      if (hour >= 19) {
        console.log('[Mensaje4Scheduler] ⏹️  Parado às 19h (regra crítica)');
        return;
      }

      console.log(`[Mensaje4Scheduler] ⏱️  Verificando Mensaje 4 em ${now.toLocaleString('es-PY')}`);

      // Buscar todos os compromissos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await getAppointmentsByDateRange(today, tomorrow);

      // Filtrar NÃO-CONFIRMADOS
      const unconfirmedAppointments = appointments.filter(
        (apt) => apt.status !== 'confirmed'
      );

      console.log(`[Mensaje4Scheduler] 📋 Total não-confirmados: ${unconfirmedAppointments.length}`);

      let sentCount = 0;
      let failedCount = 0;

      for (const apt of unconfirmedAppointments as any[]) {
        try {
          const appointmentDate = new Date(apt.appointmentDate);
          const appointmentHour = appointmentDate.getHours();
          const appointmentMinutes = appointmentDate.getMinutes();

          // Calcular horário de envio (3h ANTES)
          const sendTime = new Date(appointmentDate);
          sendTime.setHours(sendTime.getHours() - 3);

          const sendHour = sendTime.getHours();
          const sendMinutes = sendTime.getMinutes();

          // Verificar se é hora de enviar (margem de 5 minutos)
          const timeDiff = Math.abs(now.getTime() - sendTime.getTime());
          const isTimeToSend = timeDiff < 5 * 60 * 1000; // 5 minutos de margem

          if (!isTimeToSend) {
            console.log(
              `[Mensaje4Scheduler] ⏳ ${apt.patientName}: Aguardando ${sendHour}:${String(sendMinutes).padStart(2, '0')} (consulta ${appointmentHour}:${String(appointmentMinutes).padStart(2, '0')})`
            );
            continue;
          }

          // Verificar se já foi enviado
          const jobKey = `${apt.id}-mensaje4`;
          if (this.jobs.has(jobKey) && this.jobs.get(jobKey)?.status === 'sent') {
            console.log(
              `[Mensaje4Scheduler] ✅ ${apt.patientName}: Já foi enviado`
            );
            continue;
          }

          // Buscar dados do paciente
          const patient = await getPatientById(apt.patientId);
          if (!patient || !patient.phone) {
            console.error(
              `[Mensaje4Scheduler] ❌ ${apt.patientName}: Paciente não encontrado ou sem telefone`
            );
            failedCount++;
            continue;
          }

          // Obter saudação dinâmica
          const greeting = getGreeting(apt.patientName);

          // Preparar mensagem usando template "Aviso final"
          const template = escalatingFirmnessTemplates[4];
          const message = formatTemplate(template, {
            patientName: apt.patientName,
            appointmentTime: `${appointmentHour}:${String(appointmentMinutes).padStart(2, '0')}`,
            appointmentDate: apt.appointmentDate.toISOString().split("T")[0],
          });

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
            const result = { success: true, message: 'Enviado' };

            sentCount++;
            console.log(
              `[Mensaje4Scheduler] ✅ Mensaje 4 enviado para ${apt.patientName} (3h antes)`
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
              `[Mensaje4Scheduler] ❌ Erro ao enviar para ${apt.patientName}: ${sendError.message}`
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
            `[Mensaje4Scheduler] ❌ Erro ao processar ${apt.patientName}: ${error.message}`
          );
        }
      }

      if (sentCount > 0 || failedCount > 0) {
        console.log(
          `[Mensaje4Scheduler] 📊 Resultado: ${sentCount} enviadas, ${failedCount} falhadas`
        );
      } else {
        console.log(
          `[Mensaje4Scheduler] ✅ Nenhum Mensaje 4 para enviar (todos confirmados ou fora do horário)`
        );
      }
    } catch (error: any) {
      console.error('[Mensaje4Scheduler] ❌ Erro ao verificar Mensaje 4:', error);
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
export const mensaje4Scheduler = new Mensaje4Scheduler();
