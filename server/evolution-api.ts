/**
 * Evolution API Integration
 * Odonto Chin CRM
 * 
 * Funções para integração com Evolution API (WhatsApp)
 */

// ==================== CONFIGURAÇÃO ====================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
  console.warn('[Evolution API] Missing EVOLUTION_API_URL or EVOLUTION_API_KEY environment variables');
}

// ==================== TIPOS ====================

export interface SendMessageParams {
  number: string;  // Formato: 5491112345678 (código país + DDD + número)
  text: string;
}

export interface SendMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation: string;
  };
  messageTimestamp: number;
  status: string;
}

export interface QRCodeResponse {
  code: string;  // Base64 do QR Code
  base64: string;
  pairingCode?: string;
}

export interface WebhookMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
  };
}

// ==================== ENVIO DE MENSAGENS ====================

/**
 * Envia mensagem de texto via WhatsApp
 * @param instanceName Nome da instância Evolution API (ex: "bolivia-reminder-1")
 * @param params Parâmetros da mensagem (number, text)
 * @returns Resposta da API com informações da mensagem enviada
 */
export async function sendWhatsAppMessage(
  instanceName: string,
  params: SendMessageParams
): Promise<SendMessageResponse> {
  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: params.number,
        text: params.text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Evolution API] Message sent to ${params.number} via ${instanceName}`);
    
    return data;
  } catch (error) {
    console.error('[Evolution API] Send message error:', error);
    throw error;
  }
}

/**
 * Envia mensagem com mídia (imagem, áudio, vídeo, documento)
 * @param instanceName Nome da instância Evolution API
 * @param number Número do destinatário
 * @param mediaUrl URL da mídia
 * @param caption Legenda opcional
 * @param mediaType Tipo de mídia (image, audio, video, document)
 */
export async function sendWhatsAppMedia(
  instanceName: string,
  number: string,
  mediaUrl: string,
  caption?: string,
  mediaType: 'image' | 'audio' | 'video' | 'document' = 'image'
): Promise<any> {
  try {
    const url = `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number,
        mediatype: mediaType,
        media: mediaUrl,
        caption: caption || ''
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Evolution API] Media sent to ${number} via ${instanceName}`);
    
    return data;
  } catch (error) {
    console.error('[Evolution API] Send media error:', error);
    throw error;
  }
}

// ==================== GERENCIAMENTO DE INSTÂNCIAS ====================

/**
 * Cria nova instância Evolution API
 * @param instanceName Nome único da instância
 * @returns Informações da instância criada
 */
export async function createInstance(instanceName: string): Promise<any> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/create`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Evolution API] Instance created: ${instanceName}`);
    
    return data;
  } catch (error) {
    console.error('[Evolution API] Create instance error:', error);
    throw error;
  }
}

/**
 * Obtém QR Code para autenticação da instância
 * @param instanceName Nome da instância
 * @returns QR Code em base64
 */
export async function getQRCode(instanceName: string): Promise<QRCodeResponse> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Evolution API] QR Code generated for ${instanceName}`);
    
    return data;
  } catch (error) {
    console.error('[Evolution API] Get QR Code error:', error);
    throw error;
  }
}

/**
 * Verifica status de conexão da instância
 * @param instanceName Nome da instância
 * @returns Status da conexão
 */
export async function getInstanceStatus(instanceName: string): Promise<any> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Evolution API] Get instance status error:', error);
    throw error;
  }
}

/**
 * Deleta instância
 * @param instanceName Nome da instância
 */
export async function deleteInstance(instanceName: string): Promise<void> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/delete/${instanceName}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    console.log(`[Evolution API] Instance deleted: ${instanceName}`);
  } catch (error) {
    console.error('[Evolution API] Delete instance error:', error);
    throw error;
  }
}

/**
 * Logout da instância (desconecta WhatsApp)
 * @param instanceName Nome da instância
 */
export async function logoutInstance(instanceName: string): Promise<void> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/logout/${instanceName}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    console.log(`[Evolution API] Instance logged out: ${instanceName}`);
  } catch (error) {
    console.error('[Evolution API] Logout instance error:', error);
    throw error;
  }
}

// ==================== WEBHOOK ====================

/**
 * Processa webhook recebido da Evolution API
 * @param webhookData Dados do webhook
 * @returns Informações extraídas da mensagem
 */
export function parseWebhookMessage(webhookData: WebhookMessage): {
  phone: string;
  message: string;
  isFromMe: boolean;
  instance: string;
} | null {
  try {
    const { event, instance, data } = webhookData;

    // Ignorar mensagens enviadas por nós
    if (data.key.fromMe) {
      return null;
    }

    // Processar apenas eventos de mensagem recebida
    if (event !== 'messages.upsert') {
      return null;
    }

    // Extrair telefone (remover @s.whatsapp.net)
    const phone = data.key.remoteJid.replace('@s.whatsapp.net', '');

    // Extrair texto da mensagem
    let message = '';
    if (data.message?.conversation) {
      message = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      message = data.message.extendedTextMessage.text;
    }

    if (!message) {
      return null;
    }

    return {
      phone,
      message,
      isFromMe: data.key.fromMe,
      instance
    };
  } catch (error) {
    console.error('[Evolution API] Parse webhook error:', error);
    return null;
  }
}

// ==================== HELPERS ====================

/**
 * Formata número de telefone para padrão Evolution API
 * @param phone Número de telefone (pode ter +, espaços, parênteses)
 * @returns Número formatado (ex: 5491112345678)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove todos caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com código de país, assume Bolívia (591)
  if (!cleaned.startsWith('591') && !cleaned.startsWith('55') && !cleaned.startsWith('54')) {
    cleaned = '591' + cleaned;
  }
  
  return cleaned;
}

/**
 * Valida se número de telefone está no formato correto
 * @param phone Número de telefone
 * @returns true se válido
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}
