/**
 * Evolution API Service - Simplified Version
 * 
 * Serviço HTTP para integração com Evolution API externa
 * Documentação: https://doc.evolution-api.com/v2/en/get-started/introduction
 */

interface EvolutionApiConfig {
  apiUrl: string; // Ex: http://localhost:8080
  apiKey: string; // Global API key da Evolution API
}

interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
}

interface QRCodeResponse {
  base64: string;
  code: string;
}

interface ConnectionStatusResponse {
  instance: {
    instanceName: string;
    state: string; // 'open' | 'connecting' | 'close'
  };
}

/**
 * Criar nova instância WhatsApp na Evolution API
 */
export async function createInstance(
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<CreateInstanceResponse> {
  const response = await fetch(`${apiUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create instance: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Obter QR code de uma instância
 * Retries up to 5 times with 2s delay to wait for QR code generation
 */
export async function getQRCode(
  instanceName: string,
  apiUrl: string,
  apiKey: string,
  maxRetries = 5
): Promise<QRCodeResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Verify QR code is actually present
        if (data.base64 && data.base64.length > 100) {
          console.log(`[QR Code] Retrieved successfully on attempt ${attempt}`);
          return data;
        }
      }
      
      // QR code not ready yet, wait and retry
      if (attempt < maxRetries) {
        console.log(`[QR Code] Not ready yet (attempt ${attempt}/${maxRetries}), retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(`[QR Code] Error on attempt ${attempt}, retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Failed to get QR code after ${maxRetries} attempts`);
}

/**
 * Obter status de conexão de uma instância
 */
export async function getConnectionStatus(
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<ConnectionStatusResponse> {
  const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
    method: 'GET',
    headers: {
      'apikey': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get connection status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Reiniciar instância WhatsApp (reconectar sem perder credenciais)
 */
export async function restartInstance(
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${apiUrl}/instance/restart/${instanceName}`, {
    method: 'PUT',
    headers: {
      'apikey': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to restart instance: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Enviar mensagem de texto via WhatsApp
 */
export async function sendMessage(
  instanceName: string,
  phone: string,
  message: string,
  apiUrl: string,
  apiKey: string
): Promise<{ key: { id: string } }> {
  // Formatar telefone para formato internacional sem +
  const formattedPhone = phone.replace(/\D/g, '');

  const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      number: formattedPhone,
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Obter status detalhado de uma instância
 */
export async function getInstanceStatus(
  instanceName: string
): Promise<{ state: string; instanceName: string }> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Evolution API credentials not configured');
  }

  try {
    const status = await getConnectionStatus(instanceName, apiUrl, apiKey);
    return {
      state: status.instance.state,
      instanceName: status.instance.instanceName,
    };
  } catch (error: any) {
    return {
      state: 'disconnected',
      instanceName,
    };
  }
}

/**
 * Desconectar instância WhatsApp
 */
export async function disconnectInstance(
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<void> {
  const response = await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
    method: 'DELETE',
    headers: {
      'apikey': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to disconnect instance: ${response.statusText}`);
  }
}

/**
 * Deletar instância WhatsApp
 */
export async function deleteInstance(
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<void> {
  const response = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers: {
      'apikey': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete instance: ${response.statusText}`);
  }
}
