/**
 * Evolution API Webhook Handler
 * Receives incoming WhatsApp messages and detects confirmations
 */

import { Router } from "express";
import { db } from "../db";
import { appointments, patients, reschedulingAlerts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as evolutionApi from "../evolutionApiService";

const router = Router();

// Confirmation keywords (case-insensitive) - 37 variations
const CONFIRMATION_KEYWORDS = [
  // Spanish confirmations
  "si", "sí", "si confirmo", "sí confirmo", "confirmo", "confirmado", "confirmar",
  "voy", "asistiré", "asisto", "estaré", "estaré ahí", "estaré allí",
  "claro", "claro que sí", "por supuesto", "seguro", "dale", "ok", "okay",
  "perfecto", "de acuerdo", "está bien", "todo bien", "presente",
  // Portuguese confirmations
  "sim", "confirmo", "vou", "irei", "estarei", "estarei lá",
  "claro", "com certeza", "pode deixar", "beleza",
  // Emojis
  "✅", "👍", "👌", "💯"
];

// Cancellation keywords - 25 variations
const CANCELLATION_KEYWORDS = [
  // Spanish cancellations
  "no", "no voy", "no puedo", "no podré", "no iré", "no asistiré",
  "cancelar", "cancelo", "no puedo ir", "no voy a poder",
  "imposible", "no me es posible", "tengo compromiso",
  // Portuguese cancellations
  "não", "nao", "não vou", "nao vou", "não posso", "nao posso",
  "não poderei", "impossível", "impossivel", "tenho compromisso",
  // Emojis
  "❌", "🚫", "😔"
];

// Reschedule keywords - 35 variations
const RESCHEDULE_KEYWORDS = [
  // Spanish rescheduling
  "reagendar", "reagenda", "reprogramar", "cambiar", "cambiar fecha",
  "otro día", "otra fecha", "para otro día", "para otra fecha",
  "no puedo ese día", "ese día no puedo", "no tengo ese día",
  "mudar", "remarcar", "desmarcar", "mover la cita",
  "puede ser otro día", "otro horario", "otra hora",
  // Portuguese rescheduling
  "reagendar", "remarcar", "mudar", "mudar data", "outro dia",
  "outra data", "não posso nesse dia", "nao posso nesse dia",
  "esse dia não posso", "esse dia nao posso", "pode ser outro dia",
  "outro horário", "outra hora",
  // Common phrases
  "no tiene", "no tengo disponible", "tengo ocupado"
];

/**
 * Detect confirmation in message text
 */
function detectConfirmation(messageText: string): "confirmed" | "cancelled" | "reschedule" | null {
  const lowerText = messageText.toLowerCase().trim();

  // Check reschedule first (more specific)
  if (RESCHEDULE_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return "reschedule";
  }

  // Check cancellation
  if (CANCELLATION_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return "cancelled";
  }

  // Check confirmation
  if (CONFIRMATION_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return "confirmed";
  }

  return null;
}

/**
 * Find appointment by phone number
 */
async function findAppointmentByPhone(phone: string) {
  // Clean phone number (remove +, spaces, dashes)
  const cleanPhone = phone.replace(/[\s\-+]/g, "");

  // Try to find appointment in next 7 days by joining with patients table
  const results = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      patientId: appointments.patientId,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(patients.phone, cleanPhone))
    .limit(1);

  return results[0] || null;
}

/**
 * POST /api/webhook/evolution
 * Receives incoming messages from Evolution API
 */
router.post("/evolution", async (req, res) => {
  try {
    const { event, instance, data } = req.body;

    console.log("[Webhook] Received Evolution API event:", event);

    // Only process incoming messages
    if (event !== "messages.upsert") {
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    const message = data?.message;
    if (!message) {
      return res.status(200).json({ success: true, message: "No message data" });
    }

    // Extract message info
    const from = message.key?.remoteJid || "";
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || "";
    
    if (!messageText || !from) {
      return res.status(200).json({ success: true, message: "Invalid message format" });
    }

    // Extract phone number (remove @s.whatsapp.net)
    const phone = from.replace("@s.whatsapp.net", "");

    console.log(`[Webhook] Message from ${phone}: "${messageText}"`);

    // Detect confirmation type
    const confirmationType = detectConfirmation(messageText);
    
    if (!confirmationType) {
      console.log("[Webhook] No confirmation detected");
      return res.status(200).json({ success: true, message: "No confirmation detected" });
    }

    console.log(`[Webhook] Detected: ${confirmationType}`);

    // Find appointment
    const appointment = await findAppointmentByPhone(phone);

    if (!appointment) {
      console.log("[Webhook] No appointment found for this phone");
      return res.status(200).json({ success: true, message: "No appointment found" });
    }

    // Update appointment status
    let newStatus = appointment.status;
    
    if (confirmationType === "confirmed") {
      newStatus = "confirmed";
    } else if (confirmationType === "cancelled") {
      newStatus = "cancelled";
    } else if (confirmationType === "reschedule") {
      newStatus = "rescheduling_pending";
      
      // ===== MANDATORY RESCHEDULING WORKFLOW =====
      // 1. Get patient info
      const patientInfo = await db
        .select({
          id: patients.id,
          name: patients.name,
          phone: patients.phone,
        })
        .from(patients)
        .where(eq(patients.id, appointment.patientId))
        .limit(1);
      
      if (patientInfo[0]) {
        const patient = patientInfo[0];
        const whatsappLink = `https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`;
        
        // 2. Send automatic response to patient
        try {
          const apiUrl = process.env.EVOLUTION_API_URL!;
          const apiKey = process.env.EVOLUTION_API_KEY!;
          const sessionId = 'canal-recordatorios'; // Use reminders channel
          
          const autoReplyMessage = `a secretaria te ecribe ahora para reagendarte gracia ${patient.name}`;
          
          await evolutionApi.sendMessage(
            sessionId,
            patient.phone,
            autoReplyMessage,
            apiUrl,
            apiKey
          );
          
          console.log(`[Webhook] Auto-reply sent to patient: ${patient.name}`);
        } catch (error) {
          console.error('[Webhook] Failed to send auto-reply:', error);
        }
        
        // 3. Send info to secretary's corporate WhatsApp
        try {
          const apiUrl = process.env.EVOLUTION_API_URL!;
          const apiKey = process.env.EVOLUTION_API_KEY!;
          const sessionId = 'canal-clinica'; // Use clinic channel
          
          // TODO: Get secretary WhatsApp from clinic settings
          // For now, using a placeholder - user needs to configure this
          const secretaryPhone = process.env.SECRETARY_WHATSAPP || '595985360602';
          
          const secretaryMessage = `🔔 REAGENDAMENTO SOLICITADO\n\nPaciente: ${patient.name}\nWhatsApp: ${whatsappLink}\nData original: ${appointment.appointmentDate}\nHora original: ${appointment.appointmentTime}\n\nPor favor, entre em contato com o paciente para reagendar.`;
          
          await evolutionApi.sendMessage(
            sessionId,
            secretaryPhone,
            secretaryMessage,
            apiUrl,
            apiKey
          );
          
          console.log(`[Webhook] Secretary notification sent`);
        } catch (error) {
          console.error('[Webhook] Failed to send secretary notification:', error);
        }
        
        // 4. Create alert in database for popup
        try {
          await db.insert(reschedulingAlerts).values({
            appointmentId: appointment.id,
            patientId: patient.id,
            patientName: patient.name,
            patientPhone: patient.phone,
            whatsappLink,
            originalDate: appointment.appointmentDate,
            originalTime: appointment.appointmentTime,
            isRead: 0,
            isResolved: 0,
          });
          
          console.log(`[Webhook] Rescheduling alert created in database`);
        } catch (error) {
          console.error('[Webhook] Failed to create rescheduling alert:', error);
        }
      }
    }

    await db
      .update(appointments)
      .set({ 
        status: newStatus,
      })
      .where(eq(appointments.id, appointment.id));

    console.log(`[Webhook] Appointment ${appointment.id} updated to status: ${newStatus}`);

    return res.status(200).json({
      success: true,
      message: "Appointment updated",
      appointmentId: appointment.id,
      newStatus,
    });

  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
