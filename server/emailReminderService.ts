/**
 * Serviço de Recordatórios por Email
 * Envia recordatórios de confirmação de agendamentos via email
 * para pacientes que não confirmaram via WhatsApp
 */

interface EmailReminderPayload {
  patientEmail: string;
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
 * Gera templates de email com escalação de urgência
 */
export function generateEmailTemplate(payload: EmailReminderPayload): {
  subject: string;
  body: string;
  htmlBody: string;
} {
  const { patientName, appointmentDate, appointmentTime, appointmentType, clinicName, attemptNumber, urgencyLevel } = payload;

  const templates = {
    low: {
      subject: `Recordatorio: Tu cita en ${clinicName}`,
      body: `Hola ${patientName},

Te recordamos que tienes una cita programada en ${clinicName} el ${appointmentDate} a las ${appointmentTime} para ${appointmentType}.

Por favor, confirma tu asistencia respondiendo a este email o llamando al ${payload.clinicPhone}.

¡Nos vemos pronto!

${clinicName}`,
      htmlBody: `<html><body>
        <p>Hola ${patientName},</p>
        <p>Te recordamos que tienes una cita programada en <strong>${clinicName}</strong> el <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong> para <strong>${appointmentType}</strong>.</p>
        <p>Por favor, confirma tu asistencia respondiendo a este email o llamando al <strong>${payload.clinicPhone}</strong>.</p>
        <p>¡Nos vemos pronto!</p>
        <p>${clinicName}</p>
      </body></html>`,
    },
    medium: {
      subject: `⏰ IMPORTANTE: Confirma tu cita en ${clinicName}`,
      body: `Hola ${patientName},

Te enviamos este recordatorio porque aún no hemos recibido tu confirmación de asistencia.

Tu cita está programada para el ${appointmentDate} a las ${appointmentTime} en ${clinicName}.

Es importante que confirmes tu asistencia para que podamos reservar tu espacio. Por favor, responde a este email o llama al ${payload.clinicPhone} lo antes posible.

Gracias,
${clinicName}`,
      htmlBody: `<html><body>
        <p>Hola ${patientName},</p>
        <p>Te enviamos este recordatorio porque aún no hemos recibido tu confirmación de asistencia.</p>
        <p>Tu cita está programada para el <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong> en <strong>${clinicName}</strong>.</p>
        <p>Es importante que confirmes tu asistencia para que podamos reservar tu espacio. Por favor, responde a este email o llama al <strong>${payload.clinicPhone}</strong> lo antes posible.</p>
        <p>Gracias,<br>${clinicName}</p>
      </body></html>`,
    },
    high: {
      subject: `🔴 URGENTE: Confirma tu cita en ${clinicName} - ${appointmentDate}`,
      body: `Hola ${patientName},

Este es un recordatorio URGENTE: Tu cita en ${clinicName} está programada para el ${appointmentDate} a las ${appointmentTime}.

Hemos intentado contactarte varias veces sin respuesta. Es crítico que confirmes tu asistencia hoy mismo.

Por favor, confirma inmediatamente:
- Respondiendo a este email
- Llamando al ${payload.clinicPhone}
- Visitando nuestra clínica en persona

Tu espacio se mantendrá reservado solo si confirmas hoy.

${clinicName}`,
      htmlBody: `<html><body>
        <p>Hola ${patientName},</p>
        <p>Este es un recordatorio <strong style="color: red;">URGENTE</strong>: Tu cita en ${clinicName} está programada para el <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong>.</p>
        <p>Hemos intentado contactarte varias veces sin respuesta. Es crítico que confirmes tu asistencia hoy mismo.</p>
        <p>Por favor, confirma inmediatamente:</p>
        <ul>
          <li>Respondiendo a este email</li>
          <li>Llamando al <strong>${payload.clinicPhone}</strong></li>
          <li>Visitando nuestra clínica en persona</li>
        </ul>
        <p>Tu espacio se mantendrá reservado solo si confirmas hoy.</p>
        <p>${clinicName}</p>
      </body></html>`,
    },
    critical: {
      subject: `🚨 CRÍTICO: Tu cita en ${clinicName} es MAÑANA - ${appointmentDate}`,
      body: `Hola ${patientName},

¡ATENCIÓN! Tu cita en ${clinicName} es MAÑANA, ${appointmentDate} a las ${appointmentTime}.

Esta es tu última oportunidad para confirmar tu asistencia. Sin confirmación, tu espacio será cancelado y ofrecido a otro paciente.

CONFIRMA AHORA:
- Email: Responde a este mensaje
- Teléfono: ${payload.clinicPhone}
- En persona: Visita nuestra clínica

No pierdas esta oportunidad. La Dra te está esperando.

${clinicName}`,
      htmlBody: `<html><body>
        <p>Hola ${patientName},</p>
        <p><strong style="color: red; font-size: 16px;">¡ATENCIÓN!</strong> Tu cita en ${clinicName} es <strong>MAÑANA</strong>, <strong>${appointmentDate}</strong> a las <strong>${appointmentTime}</strong>.</p>
        <p>Esta es tu última oportunidad para confirmar tu asistencia. Sin confirmación, tu espacio será cancelado y ofrecido a otro paciente.</p>
        <p><strong>CONFIRMA AHORA:</strong></p>
        <ul>
          <li>Email: Responde a este mensaje</li>
          <li>Teléfono: <strong>${payload.clinicPhone}</strong></li>
          <li>En persona: Visita nuestra clínica</li>
        </ul>
        <p>No pierdas esta oportunidad. La Dra te está esperando.</p>
        <p>${clinicName}</p>
      </body></html>`,
    },
  };

  return templates[urgencyLevel];
}

/**
 * Simula envio de email (em produção, usar serviço de email real)
 */
export async function sendEmailReminder(payload: EmailReminderPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const template = generateEmailTemplate(payload);

    console.log(`📧 Enviando email de recordatorio a ${payload.patientEmail}`);
    console.log(`   Asunto: ${template.subject}`);
    console.log(`   Urgencia: ${payload.urgencyLevel}`);
    console.log(`   Intento: ${payload.attemptNumber}`);

    // Em produção, integrar com serviço de email (SendGrid, AWS SES, etc.)
    // const response = await emailService.send({
    //   to: payload.patientEmail,
    //   subject: template.subject,
    //   html: template.htmlBody,
    //   text: template.body,
    // });

    // Simulação de sucesso
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error("Erro ao enviar email de recordatorio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Agenda envio de email para horário específico
 */
export async function scheduleEmailReminder(
  payload: EmailReminderPayload,
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

    console.log(`📅 Email agendado para ${scheduledFor.toISOString()}`);

    // Em produção, usar fila de mensagens (Bull, RabbitMQ, etc.)
    // const scheduledId = await messageQueue.schedule(payload, scheduledFor);

    const scheduledId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      scheduledId,
    };
  } catch (error) {
    console.error("Erro ao agendar email de recordatorio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia série de emails com escalação de urgência
 */
export async function sendEmailReminderSeries(
  patientEmail: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentType: string,
  clinicName: string,
  clinicPhone: string
): Promise<{
  success: boolean;
  emailsSent: number;
  scheduledEmails: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let emailsSent = 0;
  let scheduledEmails = 0;

  try {
    // Email 1: 48h antes - Low urgency
    const email1 = await sendEmailReminder({
      patientEmail,
      patientName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      clinicName,
      clinicPhone,
      attemptNumber: 1,
      urgencyLevel: "low",
    });

    if (email1.success) emailsSent++;
    else errors.push(`Email 1: ${email1.error}`);

    // Email 2: 24h antes - Medium urgency
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const email2ScheduledFor = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);

    const email2 = await scheduleEmailReminder(
      {
        patientEmail,
        patientName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        clinicName,
        clinicPhone,
        attemptNumber: 2,
        urgencyLevel: "medium",
      },
      email2ScheduledFor
    );

    if (email2.success) scheduledEmails++;
    else errors.push(`Email 2: ${email2.error}`);

    // Email 3: 6h antes - High urgency
    const email3ScheduledFor = new Date(appointmentDateTime.getTime() - 6 * 60 * 60 * 1000);

    const email3 = await scheduleEmailReminder(
      {
        patientEmail,
        patientName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        clinicName,
        clinicPhone,
        attemptNumber: 3,
        urgencyLevel: "high",
      },
      email3ScheduledFor
    );

    if (email3.success) scheduledEmails++;
    else errors.push(`Email 3: ${email3.error}`);

    // Email 4: 1h antes - Critical urgency
    const email4ScheduledFor = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);

    const email4 = await scheduleEmailReminder(
      {
        patientEmail,
        patientName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        clinicName,
        clinicPhone,
        attemptNumber: 4,
        urgencyLevel: "critical",
      },
      email4ScheduledFor
    );

    if (email4.success) scheduledEmails++;
    else errors.push(`Email 4: ${email4.error}`);

    return {
      success: errors.length === 0,
      emailsSent,
      scheduledEmails,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Erro desconhecido");
    return {
      success: false,
      emailsSent,
      scheduledEmails,
      errors,
    };
  }
}
