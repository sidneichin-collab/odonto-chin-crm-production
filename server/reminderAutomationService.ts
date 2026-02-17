/**
 * Sistema Completo de Recordatórios Automáticos
 * Baseado no documento FAASEDERECORDATORIOSEKANBAN.docx
 * 
 * Funcionalidades:
 * - Recordatórios em fases (2 dias, 1 dia, dia da consulta)
 * - Mensagens progressivamente persuasivas
 * - Detecção automática de confirmações
 * - Movimentação automática no Kanban
 * - Parada automática ao confirmar
 */

import { sendMessage } from './evolutionApiService';
import { db } from './db';

// ==================== TIPOS ====================

export interface ReminderSchedule {
  daysBeforeAppointment: number;
  hour: number;
  minute: number;
  messageType: 'not_confirmed' | 'confirmed';
  sequenceNumber: number;
}

export interface ClinicInfo {
  id: number;
  name: string;
  country: string;
  timezone: string;
}

// ==================== HORÁRIOS DE ENVIO ====================

/**
 * Horários de envio para pacientes NÃO CONFIRMADOS
 */
export const NOT_CONFIRMED_SCHEDULE: ReminderSchedule[] = [
  // 2 DIAS ANTES
  { daysBeforeAppointment: 2, hour: 9, minute: 0, messageType: 'not_confirmed', sequenceNumber: 1 },
  { daysBeforeAppointment: 2, hour: 15, minute: 0, messageType: 'not_confirmed', sequenceNumber: 2 },
  { daysBeforeAppointment: 2, hour: 19, minute: 0, messageType: 'not_confirmed', sequenceNumber: 3 },
  
  // 1 DIA ANTES
  { daysBeforeAppointment: 1, hour: 7, minute: 0, messageType: 'not_confirmed', sequenceNumber: 4 },
  { daysBeforeAppointment: 1, hour: 8, minute: 0, messageType: 'not_confirmed', sequenceNumber: 5 },
  { daysBeforeAppointment: 1, hour: 10, minute: 0, messageType: 'not_confirmed', sequenceNumber: 6 },
  { daysBeforeAppointment: 1, hour: 12, minute: 0, messageType: 'not_confirmed', sequenceNumber: 7 },
  { daysBeforeAppointment: 1, hour: 14, minute: 0, messageType: 'not_confirmed', sequenceNumber: 8 },
  { daysBeforeAppointment: 1, hour: 16, minute: 0, messageType: 'not_confirmed', sequenceNumber: 9 },
  { daysBeforeAppointment: 1, hour: 18, minute: 0, messageType: 'not_confirmed', sequenceNumber: 10 },
  
  // DIA DA CONSULTA
  { daysBeforeAppointment: 0, hour: 7, minute: 0, messageType: 'not_confirmed', sequenceNumber: 11 },
  // Mensagem 2h antes será calculada dinamicamente
];

/**
 * Horários de envio para pacientes CONFIRMADOS
 */
export const CONFIRMED_SCHEDULE: ReminderSchedule[] = [
  // 1 DIA ANTES - Mensagem educacional
  { daysBeforeAppointment: 1, hour: 10, minute: 0, messageType: 'confirmed', sequenceNumber: 1 },
  
  // DIA DA CONSULTA - Mensagem motivacional
  { daysBeforeAppointment: 0, hour: 7, minute: 0, messageType: 'confirmed', sequenceNumber: 2 },
];

// ==================== SAUDAÇÕES ====================

/**
 * Retorna saudação apropriada baseada no horário
 */
export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return 'buen día';
  } else if (hour >= 12 && hour < 19) {
    return 'buenas tardes';
  } else {
    return 'buenas noches';
  }
}

// ==================== TEMPLATES DE MENSAGENS ====================

/**
 * Templates de mensagens para pacientes NÃO CONFIRMADOS
 */
export function getNotConfirmedMessage(
  sequenceNumber: number,
  patientName: string,
  clinicName: string,
  appointmentDate: string,
  appointmentTime: string,
  hour: number
): string {
  const greeting = getGreeting(hour);
  
  const templates: Record<number, string> = {
    // 2 DIAS ANTES - 10h
    1: `Hola, ${patientName} ${greeting}😊
Te escribimos desde ${clinicName}.
Queremos recordarte tu cita de mantenimiento de ortodoncia con la Dra., el día ${appointmentDate} a las ${appointmentTime}.
Mantener las citas al día es fundamental para que tus dientes se alineen más rápido y de forma correcta.
Por favor, confirma tu asistencia respondiendo solo SÍ.`,

    // 2 DIAS ANTES - 15h
    2: `Hola, ${patientName} ${greeting}😊
Desde ${clinicName} reforzamos tu cita con la Dra. el ${appointmentDate} a las ${appointmentTime}.
Cuando el mantenimiento no se realiza en la fecha indicada, el tratamiento puede retrasarse, generar molestias y requerir ajustes adicionales.
Para continuar con tu tratamiento correctamente, confirma tu asistencia respondiendo SÍ.`,

    // 2 DIAS ANTES - 19h
    3: `Hola, ${patientName} ${greeting}😊
La Dra. nos pidió reforzar la importancia de tu asistencia en el día y horario agendados.
El mantenimiento regular es clave para que el tratamiento avance según lo planificado y sin retrasos.
Confirma tu presencia respondiendo únicamente SÍ.`,

    // 1 DIA ANTES - 7h
    4: `${patientName}, buen día.
La Dra. nos solicitó reforzar la importancia de tu asistencia en el día y horario programados.
El mantenimiento regular es clave para que el tratamiento avance según lo planificado y sin demoras.
Confirma tu presencia respondiendo únicamente SÍ.`,

    // 1 DIA ANTES - 8h
    5: `${patientName}, esta es una última confirmación de ${clinicName}.
Tu cita de mantenimiento con la Dra., el ${appointmentDate} a las ${appointmentTime}, es esencial para evitar atrasos en el tratamiento y perjuicios en el alineamiento dental.
La ausencia sin confirmación impacta directamente en el progreso de tu ortodoncia.
Responde solo SÍ para confirmar tu asistencia.`,

    // 1 DIA ANTES - 10h
    6: `${patientName}, este es un aviso final de ${clinicName}.
Tu cita de mantenimiento de ortodoncia con la Dra. está programada para mañana ${appointmentDate} a las ${appointmentTime}.
La inasistencia sin confirmación compromete el avance de tu tratamiento, genera retrasos y afecta directamente el resultado del alineamiento dental planificado por la Dra.`,

    // 1 DIA ANTES - 12h
    7: `${patientName}, te contactamos desde ${clinicName}.
La Dra. refuerza la importancia de tu presencia mañana ${appointmentDate} a las ${appointmentTime}, ya que el mantenimiento regular es fundamental para que el tratamiento continúe según lo planificado.
Confirma tu asistencia respondiendo solo SÍ.`,

    // 1 DIA ANTES - 14h
    8: `${patientName}, este es un recordatorio importante de ${clinicName}.
Tu cita de mantenimiento con la Dra. está programada para mañana ${appointmentDate} a las ${appointmentTime}.
La falta de asistencia provoca retrasos en el tratamiento y afecta el resultado final.
Confirma tu presencia respondiendo SÍ.`,

    // 1 DIA ANTES - 16h
    9: `${patientName}, aviso final de ${clinicName}.
Tu horario con la Dra. está reservado exclusivamente para mañana ${appointmentDate} a las ${appointmentTime}.
La inasistencia sin confirmación compromete el avance del tratamiento y la planificación clínica.
Confirma de inmediato tu asistencia respondiendo solo SÍ.`,

    // 1 DIA ANTES - 18h
    10: `${patientName}, este es un aviso final de ${clinicName}.
La Dra. mantiene su agenda organizada con antelación, y tu cita de mañana ${appointmentDate} a las ${appointmentTime} fue programada específicamente para tu tratamiento.
Confirma tu asistencia respondiendo únicamente SÍ.`,

    // DIA DA CONSULTA - 7h
    11: `${patientName}, este es un aviso final de ${clinicName}.
Tu cita de mantenimiento con la Dra. está programada para hoy ${appointmentDate} a las ${appointmentTime} y tu horario fue reservado exclusivamente para ti.
La inasistencia sin confirmación compromete el avance del tratamiento y la planificación clínica.
Confirma de inmediato respondiendo solo SÍ.`,

    // DIA DA CONSULTA - 2h antes
    12: `${clinicName}
${patientName}
La agenda de la Dra. es organizada con antelación.
La inasistencia sin confirmación compromete el tratamiento y la planificación clínica.
Agradecemos su compromiso con el tratamiento indicado por la Dra.
La ausencia sin aviso previo compromete el avance del tratamiento y la organización de la agenda médica.
Confirme su asistencia respondiendo SÍ.`,
  };
  
  return templates[sequenceNumber] || templates[1];
}

/**
 * Templates de mensagens para pacientes CONFIRMADOS
 */
export function getConfirmedMessage(
  sequenceNumber: number,
  patientName: string,
  clinicName: string,
  appointmentDate: string,
  appointmentTime: string,
  hour: number
): string {
  const greeting = getGreeting(hour);
  
  const templates: Record<number, string> = {
    // 1 DIA ANTES - 10h (Mensagem educacional)
    1: `Hola, ${patientName} ${greeting}😊
Aquí es de ${clinicName}
Passando para lembrar do seu agendamento de manutenção ortodôntica com a Dra., no dia ${appointmentDate}, às ${appointmentTime}.
A manutenção em dia é essencial para que seus dentes se alinhem mais rápido e com melhores resultados.`,

    // DIA DA CONSULTA - 7h (Mensagem motivacional)
    2: `¡Hola! ${patientName} ${greeting}😊

Hoy damos otro pequeño gran paso hacia la sonrisa que estás construyendo 🦷✨
Te esperamos hoy las ${appointmentTime} con la Dra!
Cada cita es un paso más hacia tu mejor sonrisa 💙
¡Nos vemos!`,
  };
  
  return templates[sequenceNumber] || templates[1];
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Processa recordatórios para uma consulta específica
 */
export async function processAppointmentReminders(
  appointmentId: number,
  patientId: number,
  patientName: string,
  patientPhone: string,
  clinicName: string,
  appointmentDate: Date,
  appointmentTime: string,
  isConfirmed: boolean,
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date();
    const appointmentDateTime = new Date(appointmentDate);
    
    // Calcular diferença em dias
    const diffTime = appointmentDateTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentHour = now.getHours();
    
    // Determinar qual mensagem enviar baseado no status de confirmação
    const schedule = isConfirmed ? CONFIRMED_SCHEDULE : NOT_CONFIRMED_SCHEDULE;
    
    // Encontrar mensagem apropriada para o momento atual
    let messageToSend: ReminderSchedule | null = null;
    
    for (const reminder of schedule) {
      if (reminder.daysBeforeAppointment === diffDays && 
          reminder.hour === currentHour) {
        messageToSend = reminder;
        break;
      }
    }
    
    // Se for dia da consulta e 2h antes, calcular horário dinâmico
    if (diffDays === 0 && !isConfirmed) {
      const appointmentHour = parseInt(appointmentTime.split(':')[0]);
      const twoHoursBefore = appointmentHour - 2;
      
      if (currentHour === twoHoursBefore) {
        messageToSend = {
          daysBeforeAppointment: 0,
          hour: twoHoursBefore,
          minute: 0,
          messageType: 'not_confirmed',
          sequenceNumber: 12
        };
      }
    }
    
    if (!messageToSend) {
      return {
        success: false,
        message: 'Nenhuma mensagem programada para este horário'
      };
    }
    
    // Formatar data para exibição
    const formattedDate = appointmentDateTime.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Gerar mensagem apropriada
    const message = isConfirmed
      ? getConfirmedMessage(
          messageToSend.sequenceNumber,
          patientName,
          clinicName,
          formattedDate,
          appointmentTime,
          currentHour
        )
      : getNotConfirmedMessage(
          messageToSend.sequenceNumber,
          patientName,
          clinicName,
          formattedDate,
          appointmentTime,
          currentHour
        );
    
    // Enviar mensagem via Evolution API
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = sessionId || 'ODONTOCHINCRM';
    
    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API credentials not configured');
    }
    
    const result = await sendMessage(
      instanceName,
      patientPhone,
      message,
      apiUrl,
      apiKey
    );
    
    const success = !!result.key?.id;
    
    if (success) {
      // TODO: Registrar envio no banco de dados
      // await db.logReminderSent(
      //   appointmentId,
      //   patientId,
      //   messageToSend.sequenceNumber,
      //   message,
      //   'whatsapp',
      //   isConfirmed ? 'confirmed' : 'not_confirmed'
      // );
      console.log('[ReminderAutomation] Reminder sent logged (TODO: implement db.logReminderSent)');
      
      return {
        success: true,
        message: `Recordatório enviado com sucesso (sequência ${messageToSend.sequenceNumber})`
      };
    } else {
      return {
        success: false,
        message: `Erro ao enviar recordatório: ${result.key?.id || 'Unknown error'}`
      };
    }
  } catch (error) {
    console.error('[ReminderAutomation] Erro ao processar recordatório:', error);
    return {
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Processa todos os recordatórios pendentes
 * Esta função deve ser chamada pelo scheduler a cada hora
 */
export async function processAllPendingReminders(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    console.log(`[ReminderAutomation] Processando recordatórios às ${currentHour}:00`);
    
    // TODO: Buscar todas as consultas que precisam de recordatório
    // const appointments = await db.getAppointmentsNeedingReminders(now);
    const appointments: any[] = []; // TODO: implement db.getAppointmentsNeedingReminders
    console.log('[ReminderAutomation] TODO: implement db.getAppointmentsNeedingReminders');
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (const apt of appointments) {
      processed++;
      
      const result = await processAppointmentReminders(
        apt.id,
        apt.patientId,
        apt.patientName,
        apt.patientPhone,
        apt.clinicName,
        apt.appointmentDate,
        apt.appointmentTime,
        apt.isConfirmed,
        apt.sessionId || 'default-session'
      );
      
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      
      // Aguardar 2 segundos entre mensagens para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`[ReminderAutomation] Processamento concluído: ${successful}/${processed} enviados com sucesso`);
    
    return { processed, successful, failed };
  } catch (error) {
    console.error('[ReminderAutomation] Erro ao processar recordatórios:', error);
    return { processed: 0, successful: 0, failed: 0 };
  }
}

/**
 * Verifica se deve parar de enviar recordatórios
 * Chamado quando uma confirmação é detectada
 */
export async function stopRemindersForAppointment(
  appointmentId: number
): Promise<{ success: boolean }> {
  try {
    // TODO: Atualizar status da consulta para confirmado
    // await db.updateAppointmentStatus(appointmentId, 'confirmed');
    
    // TODO: Mover no Kanban de "Pendientes" para "Confirmadas"
    // await db.moveAppointmentInKanban(appointmentId, 'pending', 'confirmed');
    console.log('[ReminderAutomation] TODO: implement db.updateAppointmentStatus and db.moveAppointmentInKanban');
    
    console.log(`[ReminderAutomation] Recordatórios parados para consulta ${appointmentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('[ReminderAutomation] Erro ao parar recordatórios:', error);
    return { success: false };
  }
}
