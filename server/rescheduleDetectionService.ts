/**
 * Reschedule Detection Service
 * 
 * Detecta intenção de reagendamento nas mensagens do paciente
 * Transfere para secretária com informações do paciente
 */

import { invokeLLM } from "./_core/llm";

export interface RescheduleDetectionResult {
  isRescheduleRequest: boolean;
  confidence: number;
  reason: string;
  patientMessage: string;
  processedMessage: string;
}

export interface RescheduleTransferData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  currentAppointmentDate: Date;
  currentAppointmentTime: string;
  specialty: string;
  chair: number;
  rescheduleReason?: string;
  patientLink: string;
  timestamp: Date;
}

export interface SecretaryNotification {
  type: "reschedule_request";
  data: RescheduleTransferData;
  message: string;
  clinicPhone: string;
  timestamp: string;
}

export interface PatientConfirmationMessage {
  type: "reschedule_confirmation";
  message: string;
  timestamp: string;
}

/**
 * Detect reschedule request using LLM
 */
export async function detectRescheduleRequest(
  patientMessage: string,
  patientName: string
): Promise<RescheduleDetectionResult> {
  try {
    const processedMessage = patientMessage.toLowerCase().trim();

    // Quick keyword check first
    const rescheduleKeywords = [
      "reagendar",
      "cambiar",
      "cambio",
      "otra fecha",
      "otro horario",
      "no puedo",
      "no posso",
      "ocupado",
      "ocupada",
      "conflicto",
      "conflito",
      "problema",
      "imposible",
      "impossível",
      "posponer",
      "adiar",
      "aplazar",
      "cambiar la cita",
      "cambiar la consulta",
      "mudar a cita",
      "mudar a consulta",
      "otra hora",
      "outra hora",
      "diferente dia",
      "diferente día",
      "no me va",
      "não me vai",
      "no puedo ir",
      "não posso ir",
      "no voy a poder",
      "não vou poder",
    ];

    const hasKeyword = rescheduleKeywords.some((keyword) => processedMessage.includes(keyword));

    if (hasKeyword) {
      return {
        isRescheduleRequest: true,
        confidence: 95,
        reason: "Keyword match detected",
        patientMessage,
        processedMessage,
      };
    }

    // Use LLM for more nuanced detection
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert in detecting patient intentions in dental clinic messages. 
          Analyze the patient's message and determine if they are requesting to reschedule their appointment.
          
          Return a JSON response with:
          - isRescheduleRequest: boolean
          - confidence: number (0-100)
          - reason: string (brief explanation)
          
          Examples of reschedule requests:
          - "Necesito cambiar mi cita para otro día"
          - "No puedo ir a la hora que está agendado"
          - "¿Puedo reagendar para la próxima semana?"
          - "Tengo un conflicto, necesito otra hora"
          
          Patient name: ${patientName}`,
        },
        {
          role: "user",
          content: `Analyze this message and determine if it's a reschedule request: "${patientMessage}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reschedule_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              isRescheduleRequest: { type: "boolean" },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              reason: { type: "string" },
            },
            required: ["isRescheduleRequest", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid LLM response format");
    }

    const parsed = JSON.parse(content);

    return {
      isRescheduleRequest: parsed.isRescheduleRequest,
      confidence: parsed.confidence,
      reason: parsed.reason,
      patientMessage,
      processedMessage,
    };
  } catch (error) {
    console.error("Error detecting reschedule request:", error);
    return {
      isRescheduleRequest: false,
      confidence: 0,
      reason: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      patientMessage,
      processedMessage: patientMessage.toLowerCase().trim(),
    };
  }
}

/**
 * Create secretary notification message
 */
export function createSecretaryNotification(
  data: RescheduleTransferData,
  clinicPhone: string
): SecretaryNotification {
  const whatsappLink = createPatientWhatsAppLink(data.patientPhone);
  
  const message = `
📋 SOLICITAÇÃO DE REAGENDAMENTO

👤 Paciente: ${data.patientName}
📱 Telefone: ${data.patientPhone}
${data.patientEmail ? `📧 Email: ${data.patientEmail}` : ""}

📅 Agendamento Atual:
   Data: ${data.currentAppointmentDate.toLocaleDateString("es-ES")}
   Hora: ${data.currentAppointmentTime}
   Especialidade: ${data.specialty}
   Cadeira: ${data.chair}

🔗 Link WhatsApp: ${whatsappLink}

${data.rescheduleReason ? `📝 Motivo: ${data.rescheduleReason}` : ""}

⏰ Horário da Solicitação: ${data.timestamp.toLocaleTimeString("es-ES")}

---
Clique no link acima para abrir o WhatsApp do paciente e reagendar a consulta.
`;

  return {
    type: "reschedule_request",
    data,
    message,
    clinicPhone,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create patient confirmation message
 */
export function createPatientConfirmationMessage(patientName: string): PatientConfirmationMessage {
  const message = `Hola ${patientName}! 👋

Recibimos tu solicitud de reagendamiento. 

La secretaria entrará en contacto contigo ahora mismo para confirmar tu nueva fecha y hora. 

¡Gracias por tu paciencia! 💙

Clínica Odonto Chin`;

  return {
    type: "reschedule_confirmation",
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract reschedule reason from patient message
 */
export async function extractRescheduleReason(patientMessage: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Extract the reason why the patient wants to reschedule their appointment.
          Return a brief, concise reason in Spanish.
          If no reason is mentioned, return "No especificado".`,
        },
        {
          role: "user",
          content: `Patient message: "${patientMessage}"`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === "string" ? content.trim() : "No especificado";
  } catch (error) {
    console.error("Error extracting reschedule reason:", error);
    return "No especificado";
  }
}

/**
 * Format reschedule log for logging
 */
export function formatRescheduleLog(
  result: RescheduleDetectionResult,
  data: RescheduleTransferData,
  timestamp: Date = new Date()
): string {
  return `
[${timestamp.toISOString()}] Reschedule Request Detected
- Patient: ${data.patientName} (${data.patientPhone})
- Current Appointment: ${data.currentAppointmentDate.toLocaleDateString("es-ES")} at ${data.currentAppointmentTime}
- Specialty: ${data.specialty}
- Confidence: ${result.confidence}%
- Reason: ${result.reason}
- Patient Message: "${result.patientMessage}"
- Status: TRANSFERRED TO SECRETARY
`;
}

/**
 * Validate reschedule transfer data
 */
export function validateRescheduleData(data: RescheduleTransferData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push("appointmentId is required");
  if (!data.patientId) errors.push("patientId is required");
  if (!data.patientName) errors.push("patientName is required");
  if (!data.patientPhone) errors.push("patientPhone is required");
  if (!data.currentAppointmentDate) errors.push("currentAppointmentDate is required");
  if (!data.currentAppointmentTime) errors.push("currentAppointmentTime is required");
  if (!data.specialty) errors.push("specialty is required");
  if (data.chair === undefined || data.chair === null) errors.push("chair is required");
  if (!data.patientLink) errors.push("patientLink is required");

  // Validate phone format
  if (data.patientPhone && !/^\d{10,15}$/.test(data.patientPhone.replace(/\D/g, ""))) {
    errors.push("Invalid phone format");
  }

  // Validate appointment date is in the future
  if (data.currentAppointmentDate < new Date()) {
    errors.push("Appointment date must be in the future");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get reschedule summary for dashboard
 */
export function getRescheduleSummary(rescheduleRequests: RescheduleTransferData[]): {
  totalRequests: number;
  bySpecialty: Record<string, number>;
  byDate: Record<string, number>;
  averageResponseTime?: number;
} {
  const bySpecialty: Record<string, number> = {};
  const byDate: Record<string, number> = {};

  rescheduleRequests.forEach((request) => {
    bySpecialty[request.specialty] = (bySpecialty[request.specialty] || 0) + 1;

    const dateKey = request.currentAppointmentDate.toLocaleDateString("es-ES");
    byDate[dateKey] = (byDate[dateKey] || 0) + 1;
  });

  return {
    totalRequests: rescheduleRequests.length,
    bySpecialty,
    byDate,
  };
}

/**
 * Format reschedule notification for WhatsApp
 */
export function formatWhatsAppNotification(notification: SecretaryNotification): string {
  return notification.message;
}

/**
 * Create WhatsApp link for patient
 */
export function createPatientWhatsAppLink(patientPhone: string): string {
  // Remove any non-digit characters
  const cleanPhone = patientPhone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}`;
}
