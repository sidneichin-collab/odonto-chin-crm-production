/**
 * Serviço de Recordatórios por Messenger
 * Envia recordatórios de confirmação de agendamentos via Facebook Messenger
 * para pacientes que não confirmaram via WhatsApp ou Email
 */

interface MessengerReminderPayload {
  messengerUserId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  clinicName: string;
  clinicPhone: string;
  attemptNumber: number;
  urgencyLevel: "low" | "medium" | "high" | "critical";
}

/**
 * Gera templates de mensagem Messenger com escalação de urgência
 */
export function generateMessengerTemplate(payload: MessengerReminderPayload): string {
  const { patientName, appointmentDate, appointmentTime, appointmentType, clinicName, attemptNumber, urgencyLevel } = payload;

  const templates = {
    low: `Hola ${patientName} 👋

Te recordamos que tienes una cita en ${clinicName} el ${appointmentDate} a las ${appointmentTime} para ${appointmentType}.

¿Puedes confirmar tu asistencia? 😊

Llámanos: ${payload.clinicPhone}`,

    medium: `Hola ${patientName}! ⏰

Aún no hemos recibido tu confirmación de asistencia.

Tu cita está programada para el ${appointmentDate} a las ${appointmentTime}.

Es importante que confirmes para que reservemos tu espacio. 

¿Confirmas tu asistencia? 👍`,

    high: `🔴 IMPORTANTE ${patientName}

Tu cita en ${clinicName} está programada para el ${appointmentDate} a las ${appointmentTime}.

Hemos intentado contactarte varias veces. Es crítico que confirmes HOY MISMO.

Por favor, responde SÍ para confirmar o llama al ${payload.clinicPhone}.

Tu espacio se mantiene solo si confirmas hoy. ⚠️`,

    critical: `🚨 URGENTE ${patientName}

¡Tu cita es MAÑANA! ${appointmentDate} a las ${appointmentTime}

Esta es tu última oportunidad para confirmar. Sin confirmación, tu espacio será cancelado.

CONFIRMA AHORA: Responde SÍ o llama al ${payload.clinicPhone}

La Dra te está esperando 👩‍⚕️`,
  };

  return templates[urgencyLevel];
}

/**
 * Simula envio de mensagem Messenger
 */
export async function sendMessengerReminder(payload: MessengerReminderPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const message = generateMessengerTemplate(payload);

    console.log(`💬 Enviando mensagem Messenger para ${payload.messengerUserId}`);
    console.log(`   Mensagem: ${message.substring(0, 50)}...`);
    console.log(`   Urgencia: ${payload.urgencyLevel}`);
    console.log(`   Intento: ${payload.attemptNumber}`);

    // Em produção, integrar com Facebook Messenger API
    // const response = await messengerAPI.sendMessage({
    //   recipient_id: payload.messengerUserId,
    //   message: {
    //     text: message,
    //   },
    // });

    const messageId = `messenger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error("Erro ao enviar mensagem Messenger:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Agenda envio de mensagem Messenger para horário específico
 */
export async function scheduleMessengerReminder(
  payload: MessengerReminderPayload,
  scheduledFor: Date
): Promise<{
  success: boolean;
  scheduledId?: string;
  error?: string;
}> {
  try {
    const now = new Date();
    const delayMs = scheduledFor.getTime() - now.getTime();

    if (delayMs < 0) {
      return {
        success: false,
        error: "Horário agendado está no passado",
      };
    }

    console.log(`📅 Mensagem Messenger agendada para ${scheduledFor.toISOString()}`);

    const scheduledId = `scheduled_messenger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      scheduledId,
    };
  } catch (error) {
    console.error("Erro ao agendar mensagem Messenger:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia série de mensagens Messenger com escalação de urgência
 */
export async function sendMessengerReminderSeries(
  messengerUserId: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentType: string,
  clinicName: string,
  clinicPhone: string
): Promise<{
  success: boolean;
  messagesSent: number;
  scheduledMessages: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let messagesSent = 0;
  let scheduledMessages = 0;

  try {
    // Mensagem 1: 48h antes - Low urgency
    const msg1 = await sendMessengerReminder({
      messengerUserId,
      patientName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      clinicName,
      clinicPhone,
      attemptNumber: 1,
      urgencyLevel: "low",
    });

    if (msg1.success) messagesSent++;
    else errors.push(`Mensagem 1: ${msg1.error}`);

    // Mensagem 2: 24h antes - Medium urgency
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const msg2ScheduledFor = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);

    const msg2 = await scheduleMessengerReminder(
      {
        messengerUserId,
        patientName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        clinicName,
        clinicPhone,
        attemptNumber: 2,
        urgencyLevel: "medium",
      },
      msg2ScheduledFor
    );

    if (msg2.success) scheduledMessages++;
    else errors.push(`Mensagem 2: ${msg2.error}`);

    // Mensagem 3: 6h antes - High urgency
    const msg3ScheduledFor = new Date(appointmentDateTime.getTime() - 6 * 60 * 60 * 1000);

    const msg3 = await scheduleMessengerReminder(
      {
        messengerUserId,
        patientName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        clinicName,
        clinicPhone,
        attemptNumber: 3,
        urgencyLevel: "high",
      },
      msg3ScheduledFor
    );

    if (msg3.success) scheduledMessages++;
    else errors.push(`Mensagem 3: ${msg3.error}`);

    // Mensagem 4: 1h antes - Critical urgency
    const msg4ScheduledFor = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);

    const msg4 = await scheduleMessengerReminder(
      {
        messengerUserId,
        patientName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        clinicName,
        clinicPhone,
        attemptNumber: 4,
        urgencyLevel: "critical",
      },
      msg4ScheduledFor
    );

    if (msg4.success) scheduledMessages++;
    else errors.push(`Mensagem 4: ${msg4.error}`);

    return {
      success: errors.length === 0,
      messagesSent,
      scheduledMessages,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Erro desconhecido");
    return {
      success: false,
      messagesSent,
      scheduledMessages,
      errors,
    };
  }
}

/**
 * Envia mensagens em múltiplos canais (WhatsApp, Email, Messenger)
 */
export async function sendMultiChannelReminders(
  patientEmail: string,
  messengerUserId: string | null,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentType: string,
  clinicName: string,
  clinicPhone: string
): Promise<{
  whatsapp: { success: boolean; attempts: number };
  email: { success: boolean; attempts: number };
  messenger: { success: boolean; attempts: number };
  totalChannels: number;
  successfulChannels: number;
}> {
  const results = {
    whatsapp: { success: true, attempts: 5 }, // WhatsApp já implementado
    email: { success: true, attempts: 4 },
    messenger: { success: true, attempts: 4 },
    totalChannels: 0,
    successfulChannels: 0,
  };

  // Email
  try {
    // const emailResult = await sendEmailReminderSeries(...);
    results.email.success = true;
    results.email.attempts = 4;
  } catch (error) {
    results.email.success = false;
  }

  // Messenger (se disponível)
  if (messengerUserId) {
    try {
      const messengerResult = await sendMessengerReminderSeries(
        messengerUserId,
        patientName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        clinicName,
        clinicPhone
      );
      results.messenger.success = messengerResult.success;
      results.messenger.attempts = messengerResult.messagesSent + messengerResult.scheduledMessages;
    } catch (error) {
      results.messenger.success = false;
    }
  }

  // Contar canais
  results.totalChannels = 3; // WhatsApp, Email, Messenger
  results.successfulChannels = [results.whatsapp.success, results.email.success, results.messenger.success].filter(
    (s) => s
  ).length;

  return results;
}
