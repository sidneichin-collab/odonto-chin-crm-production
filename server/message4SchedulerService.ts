import { sendReminderMessage, getGreetingByHour, isOrthodonticAppointment, getConfirmationDelay } from "./whatsappReminderService";
import { ENV } from "./_core/env";
import { db } from "./db";

async function getDb() { return db; }

export interface SchedulerJob {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: Date;
  appointmentTime: string;
  appointmentType: string;
  messageType: "message3" | "message4" | "post_attendance";
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
}

/**
 * Calcular horário de envio de Mensaje 4 (3h antes)
 */
export function calculateMessage4SendTime(appointmentDate: Date, appointmentTime: string): Date {
  const [hours, minutes] = appointmentTime.split(":").map(Number);
  const sendTime = new Date(appointmentDate);
  sendTime.setHours(hours - 3, minutes, 0, 0);
  return sendTime;
}

/**
 * Buscar todos os agendamentos de hoje que ainda não receberam Mensaje 4
 */
export async function getUnsentMessage4Jobs(): Promise<SchedulerJob[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar agendamentos de hoje que não confirmaram
    const appointments = await (db as any).query.appointments.findMany({
      where: (table: any) => {
        return (table: any) => {
          // Appointments for today
          // Status != "confirmed"
          // Not yet sent message4
        };
      },
      with: {
        patient: true,
      },
    });

    const jobs: SchedulerJob[] = [];

    for (const apt of appointments) {
      // PULAR confirmados - Mensaje 4 APENAS para não-confirmados
      if (apt.status === "confirmed") {
        console.log(`[Scheduler] ⏭️  Pulando ${apt.patient.fullName} (já confirmou)`);
        continue;
      }

      const appointmentDate = new Date(apt.appointmentDate);
      const sendTime = calculateMessage4SendTime(appointmentDate, apt.appointmentTime);

      // Check if it's time to send (within 5 minute window)
      const timeDiff = sendTime.getTime() - now.getTime();
      if (timeDiff > 0 && timeDiff < 5 * 60 * 1000) {
        jobs.push({
          appointmentId: apt.id,
          patientId: apt.patientId,
          patientName: apt.patient.fullName,
          patientPhone: apt.patient.phone,
          appointmentDate,
          appointmentTime: apt.appointmentTime,
          appointmentType: apt.appointmentType,
          messageType: "message4",
          scheduledFor: sendTime,
          sent: false,
        });
      }
    }

    return jobs;
  } catch (error) {
    console.error("[Scheduler] Erro ao buscar jobs de Mensaje 4:", error);
    return [];
  }
}

/**
 * Enviar Mensaje 4 para paciente não-confirmado
 */
export async function sendMessage4(job: SchedulerJob): Promise<boolean> {
  const greeting = getGreetingByHour(job.scheduledFor);
  
  const message = `${greeting} ${job.patientName}!
  
ÚLTIMA OPORTUNIDADE: Tu cita es hoy con la Dra.
Tu tratamiento depende de esto. ¡Confirma ahora!

Ortobom Odontología`;

  const result = await sendReminderMessage(job.patientPhone, message);

  return result;
}

/**
 * Executar scheduler de Mensaje 4
 */
export async function runMessage4Scheduler() {
  console.log("[Scheduler] Iniciando verificação de Mensaje 4...");
  
  const jobs = await getUnsentMessage4Jobs();
  
  if (jobs.length === 0) {
    console.log("[Scheduler] Nenhum Mensaje 4 para enviar agora");
    return { total: 0, sent: 0, failed: 0 };
  }

  console.log(`[Scheduler] Encontrados ${jobs.length} Mensaje 4 para enviar`);

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const success = await sendMessage4(job);
      if (success) {
        sent++;
        console.log(`[Scheduler] ✅ Mensaje 4 enviado para ${job.patientName}`);
      } else {
        failed++;
        console.log(`[Scheduler] ❌ Falha ao enviar Mensaje 4 para ${job.patientName}`);
      }
    } catch (error) {
      failed++;
      console.error(`[Scheduler] Erro ao enviar Mensaje 4 para ${job.patientName}:`, error);
    }
  }

  return { total: jobs.length, sent, failed };
}
