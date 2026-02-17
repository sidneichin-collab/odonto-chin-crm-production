/**
 * Sistema de Recordatórios WhatsApp
 * Odonto Chin CRM
 * 
 * Funções para agendar, enviar e processar recordatórios de consultas
 */

import { getDb } from './db';
import { appointments, patients, reminderQueue, reminderResponses, whatsappNumbers } from '../drizzle/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';

// ==================== TIPOS ====================

export type ReminderType =
  | '2_days_before_10h'
  | '2_days_before_15h'
  | '2_days_before_19h'
  | '1_day_before_7h'
  | '1_day_before_8h'
  | '1_day_before_10h'
  | '1_day_before_12h'
  | '1_day_before_14h'
  | '1_day_before_16h'
  | '1_day_before_18h'
  | 'same_day_6h30'
  | 'same_day_3h_before'
  | 'post_confirmation_next_day'
  | 'same_day_confirmed_7h';

export type DetectedIntent = 'confirmed' | 'cancelled' | 'reschedule' | 'unknown';

// ==================== PALAVRAS-CHAVE ====================

const CONFIRMATION_KEYWORDS = [
  'si', 'sí', 'confirmo', 'voy', 'estaré', 'asisto', 'ok', 'está bien',
  'perfecto', 'de acuerdo', 'claro', 'seguro', 'por supuesto',
  '✅', '👍', '✔️', 'yes', 'afirmativo'
];

const CANCELLATION_KEYWORDS = [
  'no', 'no voy', 'no puedo', 'cancelar', 'cancelo', 'no asistiré',
  'no podré', 'imposible', 'no me es posible', '❌', '👎'
];

const RESCHEDULE_KEYWORDS = [
  'reagenda', 'reagendar', 'cambiar', 'cambio', 'otro día', 'otra fecha',
  'no puedo ese día', 'no tiene otro horario', 'otra hora',
  'reprogramar', 'mover la cita', 'cambio de fecha'
];

// ==================== TEMPLATES DE MENSAGENS ====================

export function getMessageTemplate(
  reminderType: ReminderType,
  patientName: string,
  doctorName: string,
  appointmentDate: string,
  appointmentTime: string
): string {
  const templates: Record<ReminderType, string> = {
    '2_days_before_10h': `¡Hola ${patientName}! 👋

La Dra. ${doctorName} dice que tu tratamiento de ortodoncia va muy bien.

Para acelerar el alineamiento es fundamental asistir en la fecha programada.

📅 Confirmamos tu cita:
• Fecha: ${appointmentDate}
• Hora: ${appointmentTime}
• Con: Dra. ${doctorName}

¿Confirmas tu asistencia? Responde SÍ para confirmar.`,

    '2_days_before_15h': `${patientName}, recordatorio importante de ORTOBOM ODONTOLOGÍA 🦷

Tu cita de mantenimiento de ortodoncia está programada para ${appointmentDate} a las ${appointmentTime}.

La Dra. ${doctorName} espera verte para continuar con tu tratamiento.

Por favor confirma tu asistencia respondiendo SÍ.`,

    '2_days_before_19h': `${patientName}, la Dra. ${doctorName} te recuerda:

Tu cita de ortodoncia es el ${appointmentDate} a las ${appointmentTime}.

Es importante mantener la regularidad del tratamiento para obtener los mejores resultados.

Confirma tu asistencia respondiendo SÍ.`,

    '1_day_before_7h': `${patientName}, mañana ${appointmentDate} a las ${appointmentTime} tienes tu cita de ortodoncia con la Dra. ${doctorName}.

Tu horario está reservado exclusivamente para ti.

¿Confirmas tu asistencia? Responde SÍ.`,

    '1_day_before_8h': `${patientName}, mañana ${appointmentDate} a las ${appointmentTime} tienes tu cita de ortodoncia con la Dra. ${doctorName}.

Tu horario está reservado exclusivamente para ti.

¿Confirmas tu asistencia? Responde SÍ.`,

    '1_day_before_10h': `${patientName}, mañana ${appointmentDate} a las ${appointmentTime} tienes tu cita de ortodoncia con la Dra. ${doctorName}.

Tu horario está reservado exclusivamente para ti.

¿Confirmas tu asistencia? Responde SÍ.`,

    '1_day_before_12h': `${patientName}, mañana ${appointmentDate} a las ${appointmentTime} tienes tu cita de ortodoncia con la Dra. ${doctorName}.

Tu horario está reservado exclusivamente para ti.

¿Confirmas tu asistencia? Responde SÍ.`,

    '1_day_before_14h': `${patientName}, mañana ${appointmentDate} a las ${appointmentTime} tienes tu cita de ortodoncia con la Dra. ${doctorName}.

Tu horario está reservado exclusivamente para ti.

¿Confirmas tu asistencia? Responde SÍ.`,

    '1_day_before_16h': `${patientName}, mañana ${appointmentDate} a las ${appointmentTime} tienes tu cita de ortodoncia con la Dra. ${doctorName}.

Tu horario está reservado exclusivamente para ti.

¿Confirmas tu asistencia? Responde SÍ.`,

    '1_day_before_18h': `${patientName}, mañana ${appointmentDate} a las ${appointmentTime} tienes tu cita de ortodoncia con la Dra. ${doctorName}.

Tu horario está reservado exclusivamente para ti.

¿Confirmas tu asistencia? Responde SÍ.`,

    'same_day_6h30': `${patientName}, este es un aviso final de ORTOBOM ODONTOLOGÍA.

Tu cita de mantenimiento de ortodoncia con la Dra. está programada para HOY ${appointmentDate} a las ${appointmentTime}.

⚠️ La inasistencia sin confirmación:
• Compromete el avance de tu tratamiento
• Genera retrasos en el alineamiento dental
• Afecta directamente el resultado planificado por la Dra.

La agenda médica es organizada con antelación y tu horario está reservado exclusivamente para ti.

Confirma de inmediato tu asistencia respondiendo solo SÍ.`,

    'same_day_3h_before': `${patientName}, este es un aviso final de ORTOBOM ODONTOLOGÍA.

Tu cita de mantenimiento de ortodoncia con la Dra. está programada para HOY ${appointmentDate} a las ${appointmentTime}.

⚠️ La inasistencia sin confirmación:
• Compromete el avance de tu tratamiento
• Genera retrasos en el alineamiento dental
• Afecta directamente el resultado planificado por la Dra.

La agenda médica es organizada con antelación y tu horario está reservado exclusivamente para ti.

Confirma de inmediato tu asistencia respondiendo solo SÍ.`,

    'post_confirmation_next_day': `¡Gracias por confirmar, ${patientName}! ✅

Te esperamos ${appointmentDate} a las ${appointmentTime} con la Dra. ${doctorName}.

💡 Recomendaciones antes de tu cita:
• Cepilla bien tus dientes
• Evita comer 1 hora antes
• Llega 5 minutos antes

¡Nos vemos pronto! 🦷`,

    'same_day_confirmed_7h': `¡Buenos días, ${patientName}! ☀️

Hoy es tu cita de ortodoncia a las ${appointmentTime} con la Dra. ${doctorName}.

Estamos emocionados de verte y continuar con tu hermosa sonrisa.

¡Te esperamos! 😊🦷`
  };

  return templates[reminderType];
}

// ==================== DETECÇÃO DE INTENT ====================

export function detectIntent(message: string): DetectedIntent {
  const text = message.toLowerCase().trim();

  // Prioridade 1: Confirmação
  if (CONFIRMATION_KEYWORDS.some(kw => text.includes(kw))) {
    return 'confirmed';
  }

  // Prioridade 2: Reagendamento
  if (RESCHEDULE_KEYWORDS.some(kw => text.includes(kw))) {
    return 'reschedule';
  }

  // Prioridade 3: Cancelamento
  if (CANCELLATION_KEYWORDS.some(kw => text.includes(kw))) {
    return 'cancelled';
  }

  return 'unknown';
}

export function extractKeywords(message: string, intent: DetectedIntent): string {
  const text = message.toLowerCase().trim();
  const keywords: string[] = [];

  let keywordList: string[] = [];
  if (intent === 'confirmed') {
    keywordList = CONFIRMATION_KEYWORDS;
  } else if (intent === 'cancelled') {
    keywordList = CANCELLATION_KEYWORDS;
  } else if (intent === 'reschedule') {
    keywordList = RESCHEDULE_KEYWORDS;
  }

  keywordList.forEach(kw => {
    if (text.includes(kw)) {
      keywords.push(kw);
    }
  });

  return keywords.join(', ');
}

// ==================== AGENDAMENTO DE RECORDATÓRIOS ====================

export async function scheduleReminders(appointmentId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Buscar agendamento
  const [appointment] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      status: appointments.status
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appointment) {
    throw new Error(`Appointment ${appointmentId} not found`);
  }

  // Não agendar se já confirmado ou cancelado
  if (appointment.status === 'confirmed' || appointment.status === 'cancelled') {
    console.log(`[Reminders] Appointment ${appointmentId} already ${appointment.status}, skipping`);
    return;
  }

  const appointmentDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
  
  // Criar data completa do agendamento
  const fullAppointmentDateTime = new Date(appointmentDate);
  fullAppointmentDateTime.setHours(hours, minutes, 0, 0);

  // Calcular datas
  const twoDaysBefore = new Date(appointmentDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  const oneDayBefore = new Date(appointmentDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);

  // Helper para criar timestamp
  const setTime = (date: Date, time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(h, m, 0, 0);
    return newDate.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Helper para subtrair horas
  const subtractHours = (date: Date, time: string, hoursToSubtract: number): string => {
    const [h, m] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(h - hoursToSubtract, m, 0, 0);
    return newDate.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Criar fila de recordatórios
  const reminders: Array<{ type: ReminderType; scheduledAt: string }> = [
    // 2 dias antes
    { type: '2_days_before_10h', scheduledAt: setTime(twoDaysBefore, '10:00') },
    { type: '2_days_before_15h', scheduledAt: setTime(twoDaysBefore, '15:00') },
    { type: '2_days_before_19h', scheduledAt: setTime(twoDaysBefore, '19:00') },

    // 1 dia antes
    { type: '1_day_before_7h', scheduledAt: setTime(oneDayBefore, '07:00') },
    { type: '1_day_before_8h', scheduledAt: setTime(oneDayBefore, '08:00') },
    { type: '1_day_before_10h', scheduledAt: setTime(oneDayBefore, '10:00') },
    { type: '1_day_before_12h', scheduledAt: setTime(oneDayBefore, '12:00') },
    { type: '1_day_before_14h', scheduledAt: setTime(oneDayBefore, '14:00') },
    { type: '1_day_before_16h', scheduledAt: setTime(oneDayBefore, '16:00') },
    { type: '1_day_before_18h', scheduledAt: setTime(oneDayBefore, '18:00') },

    // Dia da consulta
    { type: 'same_day_6h30', scheduledAt: setTime(appointmentDate, '06:30') },
    { type: 'same_day_3h_before', scheduledAt: subtractHours(appointmentDate, appointment.appointmentTime, 3) }
  ];

  // Inserir na fila
  for (const reminder of reminders) {
    await db.insert(reminderQueue).values({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      reminderType: reminder.type,
      scheduledAt: reminder.scheduledAt,
      status: 'pending'
    });
  }

  console.log(`[Reminders] Scheduled ${reminders.length} reminders for appointment ${appointmentId}`);
}

// ==================== CANCELAR RECORDATÓRIOS ====================

export async function cancelPendingReminders(appointmentId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(reminderQueue)
    .set({ status: 'cancelled' })
    .where(and(
      eq(reminderQueue.appointmentId, appointmentId),
      eq(reminderQueue.status, 'pending')
    ));

  console.log(`[Reminders] Cancelled pending reminders for appointment ${appointmentId}`);
}

// ==================== PROCESSAR RESPOSTA ====================

export async function processIncomingMessage(
  phone: string,
  messageText: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Buscar paciente pelo telefone
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.phone, phone))
    .limit(1);

  if (!patient) {
    console.log(`[Reminders] Patient not found for phone ${phone}`);
    return;
  }

  // Buscar agendamento pendente do paciente
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(
      eq(appointments.patientId, patient.id),
      eq(appointments.status, 'scheduled')
    ))
    .limit(1);

  if (!appointment) {
    console.log(`[Reminders] No pending appointment for patient ${patient.id}`);
    return;
  }

  // Detectar intent
  const intent = detectIntent(messageText);
  const keywords = extractKeywords(messageText, intent);

  // Salvar resposta
  await db.insert(reminderResponses).values({
    appointmentId: appointment.id,
    patientId: patient.id,
    messageText,
    detectedIntent: intent,
    detectedKeywords: keywords,
    receivedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    processed: 0
  });

  // Processar ação baseada no intent
  if (intent === 'confirmed') {
    await handleConfirmation(appointment.id);
  } else if (intent === 'cancelled') {
    await handleCancellation(appointment.id);
  } else if (intent === 'reschedule') {
    await handleReschedule(appointment.id, patient.id);
  }

  console.log(`[Reminders] Processed message from ${phone}, intent: ${intent}`);
}

async function handleConfirmation(appointmentId: number) {
  const db = await getDb();
  if (!db) return;

  // Atualizar status do agendamento
  await db
    .update(appointments)
    .set({
      status: 'confirmed',
      confirmedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
    .where(eq(appointments.id, appointmentId));

  // Cancelar recordatórios pendentes
  await cancelPendingReminders(appointmentId);

  // Agendar mensagem pós-confirmação (dia seguinte 10h)
  // Agendar mensagem motivacional (dia da consulta 7h)
  // TODO: Implementar agendamento dessas mensagens

  console.log(`[Reminders] Appointment ${appointmentId} confirmed`);
}

async function handleCancellation(appointmentId: number) {
  const db = await getDb();
  if (!db) return;

  // Atualizar status do agendamento
  await db
    .update(appointments)
    .set({ status: 'cancelled' })
    .where(eq(appointments.id, appointmentId));

  // Cancelar recordatórios pendentes
  await cancelPendingReminders(appointmentId);

  console.log(`[Reminders] Appointment ${appointmentId} cancelled`);
}

async function handleReschedule(appointmentId: number, patientId: number) {
  const db = await getDb();
  if (!db) return;

  // Atualizar status do agendamento
  await db
    .update(appointments)
    .set({ status: 'rescheduling_pending' })
    .where(eq(appointments.id, appointmentId));

  // Cancelar recordatórios pendentes
  await cancelPendingReminders(appointmentId);

  // TODO: Criar alerta para secretária
  // TODO: Enviar notificação ao WhatsApp corporativo

  console.log(`[Reminders] Appointment ${appointmentId} marked for rescheduling`);
}

// ==================== SELEÇÃO DE NÚMERO WHATSAPP ====================

export async function selectWhatsAppNumber(country: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 19).replace('T', ' ');

  // Buscar uso de cada número hoje
  const usage = await db
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

  // Buscar números do país
  const countryNumbers = await db
    .select()
    .from(whatsappNumbers)
    .where(and(
      eq(whatsappNumbers.country, country),
      eq(whatsappNumbers.channelType, 'reminders'),
      eq(whatsappNumbers.status, 'active')
    ));

  if (countryNumbers.length === 0) {
    console.log(`[Reminders] No active WhatsApp numbers for country ${country}`);
    return null;
  }

  // Selecionar número com menor uso
  let selectedNumber = countryNumbers[0];
  let minUsage = 0;

  for (const number of countryNumbers) {
    const used = usage.find(u => u.whatsappNumber === number.phoneNumber);
    const usageCount = used ? Number(used.count) : 0;

    if (usageCount < (number.dailyLimit || 1000)) {
      if (usageCount < minUsage || minUsage === 0) {
        selectedNumber = number;
        minUsage = usageCount;
      }
    }
  }

  return selectedNumber.phoneNumber;
}
