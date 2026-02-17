/**
 * N8N + Evolution API Integration Service
 * Envia mensagens WhatsApp via N8N webhook
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 
  'https://odontochicrmsecretaria.app.n8n.cloud/webhook-test/8eef988c5-64bc-4bf0-8a6b-1eb5af717feb';

export interface SendMessagePayload {
  number: string;
  message: string;
  patientName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
  timestamp: number;
}

/**
 * Envia mensagem WhatsApp via N8N webhook
 * @param payload - Dados da mensagem a enviar
 * @returns Resposta da API
 */
export async function sendMessageViaN8N(
  payload: SendMessagePayload
): Promise<SendMessageResponse> {
  const timestamp = Date.now();

  try {
    // Validar número de telefone
    if (!payload.number || payload.number.trim() === '') {
      return {
        success: false,
        message: 'Número de telefone inválido',
        error: 'Phone number is required',
        timestamp,
      };
    }

    // Validar mensagem
    if (!payload.message || payload.message.trim() === '') {
      return {
        success: false,
        message: 'Mensagem vazia',
        error: 'Message is required',
        timestamp,
      };
    }

    // Preparar payload para N8N
    const n8nPayload = {
      number: payload.number.replace(/\D/g, ''), // Remove caracteres não-numéricos
      message: payload.message,
      patientName: payload.patientName || '',
      appointmentDate: payload.appointmentDate || '',
      appointmentTime: payload.appointmentTime || '',
      sentAt: new Date().toISOString(),
    };

    // Enviar para N8N webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    // Verificar resposta
    if (!response.ok) {
      return {
        success: false,
        message: `Erro ao enviar mensagem (HTTP ${response.status})`,
        error: `HTTP Error: ${response.status}`,
        timestamp,
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Mensagem enviada com sucesso',
      messageId: result.messageId || `msg_${timestamp}`,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return {
      success: false,
      message: 'Erro ao enviar mensagem via N8N',
      error: errorMessage,
      timestamp,
    };
  }
}

/**
 * Envia mensagem em lote para múltiplos pacientes
 * @param messages - Array de mensagens a enviar
 * @returns Array com resultados de cada envio
 */
export async function sendBatchMessagesViaN8N(
  messages: SendMessagePayload[]
): Promise<SendMessageResponse[]> {
  const results: SendMessageResponse[] = [];

  for (const message of messages) {
    const result = await sendMessageViaN8N(message);
    results.push(result);

    // Aguardar 1 segundo entre envios para evitar rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Testa a conexão com N8N webhook
 * @returns Status da conexão
 */
export async function testN8NConnection(): Promise<{
  success: boolean;
  message: string;
  webhookUrl: string;
  timestamp: number;
}> {
  const timestamp = Date.now();

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Webhook retornou erro HTTP ${response.status}`,
        webhookUrl: N8N_WEBHOOK_URL,
        timestamp,
      };
    }

    return {
      success: true,
      message: 'Conexão com N8N webhook estabelecida com sucesso',
      webhookUrl: N8N_WEBHOOK_URL,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return {
      success: false,
      message: `Erro ao conectar com N8N: ${errorMessage}`,
      webhookUrl: N8N_WEBHOOK_URL,
      timestamp,
    };
  }
}

/**
 * Formata mensagem de recordatório para N8N
 * @param patientName - Nome do paciente
 * @param appointmentDate - Data do agendamento
 * @param appointmentTime - Hora do agendamento
 * @param messageType - Tipo de mensagem (reminder, confirmation, etc)
 * @returns Mensagem formatada
 */
export function formatReminderMessage(
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  messageType: 'reminder' | 'confirmation' | 'urgent' = 'reminder'
): string {
  const templates = {
    reminder: `¡Hola ${patientName}! 👋\n\nTe recordamos que tienes una cita programada para el ${appointmentDate} a las ${appointmentTime}.\n\nPor favor, confirma tu asistencia respondiendo con "SÍ CONFIRMO".\n\n¡Gracias!`,
    confirmation: `¡Excelente ${patientName}! ✅\n\nTu cita ha sido confirmada para el ${appointmentDate} a las ${appointmentTime}.\n\nLa Dra te espera. ¡Nos vemos pronto!`,
    urgent: `⚠️ ¡IMPORTANTE ${patientName}!\n\nTu cita es HOY a las ${appointmentTime}.\n\nConfirma tu asistencia ahora: "SÍ CONFIRMO"\n\nLa Dra te espera.`,
  };

  return templates[messageType];
}

/**
 * Envia recordatório automático via N8N
 * @param patientPhone - Telefone do paciente
 * @param patientName - Nome do paciente
 * @param appointmentDate - Data do agendamento
 * @param appointmentTime - Hora do agendamento
 * @returns Resultado do envio
 */
export async function sendAutomaticReminder(
  patientPhone: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<SendMessageResponse> {
  const message = formatReminderMessage(patientName, appointmentDate, appointmentTime, 'reminder');

  return sendMessageViaN8N({
    number: patientPhone,
    message,
    patientName,
    appointmentDate,
    appointmentTime,
  });
}
