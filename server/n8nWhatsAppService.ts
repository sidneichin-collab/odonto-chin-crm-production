/**
 * n8n WhatsApp Integration Service
 * 
 * Este serviço integra o CRM com n8n + Evolution API para enviar/receber mensagens WhatsApp
 */

// Imports para futuras funcionalidades
// import { reminderLogs } from '../drizzle/schema';

interface N8nSendMessageParams {
  sessionId: string;
  phone: string;
  message: string;
  mediaUrl?: string; // URL da mídia (imagem, PDF, vídeo)
  mediaType?: "image" | "document" | "video" | "audio"; // Tipo da mídia
  fileName?: string; // Nome do arquivo (para documentos)
}

interface N8nSendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia mensagem WhatsApp via n8n webhook
 */
export async function sendWhatsAppViaN8n(params: N8nSendMessageParams): Promise<N8nSendMessageResponse> {
  const { sessionId, phone, message, mediaUrl, mediaType, fileName } = params;
  
  // Buscar configuração do n8n no banco
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!n8nWebhookUrl) {
    console.error('[n8n] N8N_WEBHOOK_URL não configurada');
    return {
      success: false,
      error: 'N8N_WEBHOOK_URL não configurada. Configure em Canais → Configurar n8n'
    };
  }
  
  try {
    console.log(`[n8n] Enviando mensagem via n8n para ${phone}`);
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        phone,
        message,
        ...(mediaUrl && { 
          mediaUrl, 
          mediaType: mediaType || "image",
          ...(fileName && { fileName })
        }),
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[n8n] Erro ao enviar mensagem: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Erro HTTP ${response.status}: ${errorText}`
      };
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`[n8n] Mensagem enviada com sucesso: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } else {
      console.error(`[n8n] Falha ao enviar mensagem: ${result.error}`);
      return {
        success: false,
        error: result.error || 'Erro desconhecido'
      };
    }
  } catch (error: any) {
    console.error('[n8n] Erro ao chamar webhook n8n:', error.message);
    return {
      success: false,
      error: `Erro de conexão: ${error.message}`
    };
  }
}

/**
 * Processa mensagem recebida do webhook n8n
 */
export interface IncomingWhatsAppMessage {
  sessionId: string;
  from: string;
  fromName: string;
  message: string;
  messageId: string;
  timestamp: number;
}

export async function processIncomingMessage(data: IncomingWhatsAppMessage): Promise<void> {
  const { sessionId, from, fromName, message, messageId, timestamp } = data;
  
  console.log(`[n8n] Mensagem recebida de ${fromName} (${from}): ${message}`);
  
  // TODO: Implementar lógica de processamento de mensagens recebidas
  // - Atualizar status de confirmação de consulta
  // - Criar conversa no Kanban
  // - Notificar secretária
  
  // Por enquanto, apenas registrar no log
  console.log(`[n8n] Mensagem processada: ${messageId}`);
}

/**
 * Testa conexão com n8n webhook
 */
export async function testN8nConnection(): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!n8nWebhookUrl) {
    return {
      success: false,
      message: 'N8N_WEBHOOK_URL não configurada'
    };
  }
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: 'test',
        phone: '5511999999999',
        message: 'Teste de conexão',
        test: true,
      }),
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        success: true,
        message: `Conexão OK! Tempo de resposta: ${responseTime}ms`,
        responseTime
      };
    } else {
      return {
        success: false,
        message: `Erro HTTP ${response.status}`,
        responseTime
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      message: `Erro de conexão: ${error.message}`,
      responseTime
    };
  }
}
