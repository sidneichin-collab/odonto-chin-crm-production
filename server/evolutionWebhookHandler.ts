/**
 * Evolution API Webhook Handler
 * Receives incoming WhatsApp messages and processes them
 */

import type { Request, Response } from 'express';
import { processConfirmation, processRescheduleRequest } from './confirmationDetectorService';

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName: string;
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
  };
}

/**
 * Handle incoming Evolution API webhook
 */
export async function handleEvolutionWebhook(req: Request, res: Response) {
  try {
    const payload: EvolutionWebhookPayload = req.body;
    
    console.log('[EvolutionWebhook] Received:', JSON.stringify(payload, null, 2));
    
    // Only process incoming messages (not sent by us)
    if (payload.data?.key?.fromMe) {
      console.log('[EvolutionWebhook] Ignoring message sent by us');
      return res.status(200).json({ success: true, message: 'Ignored (fromMe)' });
    }
    
    // Extract message text
    const messageText = 
      payload.data?.message?.conversation ||
      payload.data?.message?.extendedTextMessage?.text ||
      '';
    
    if (!messageText) {
      console.log('[EvolutionWebhook] No text in message');
      return res.status(200).json({ success: true, message: 'No text' });
    }
    
    // Extract phone number (remove @s.whatsapp.net)
    const phone = payload.data?.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    
    if (!phone) {
      console.log('[EvolutionWebhook] No phone number');
      return res.status(200).json({ success: true, message: 'No phone' });
    }
    
    console.log(`[EvolutionWebhook] Processing message from ${phone}: "${messageText}"`);
    
    // Process confirmation
    const confirmationResult = await processConfirmation(phone, messageText);
    
    if (confirmationResult.detected && confirmationResult.movedToConfirmed) {
      console.log(`[EvolutionWebhook] ✅ Appointment ${confirmationResult.appointmentId} confirmed!`);
      
      // TODO: Emit event for real-time updates
      // eventEmitter.emit('appointment:confirmed', {
      //   appointmentId: confirmationResult.appointmentId,
      //   timestamp: Date.now()
      // });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Confirmation processed',
        appointmentId: confirmationResult.appointmentId
      });
    }
    
    // Process reschedule request
    const rescheduleResult = await processRescheduleRequest(phone, messageText);
    
    if (rescheduleResult.detected) {
      console.log(`[EvolutionWebhook] 📅 Reschedule request detected from ${phone}`);
      
      // TODO: Emit event for real-time updates
      // eventEmitter.emit('appointment:rescheduleRequested', {
      //   phone,
      //   message: messageText,
      //   timestamp: Date.now()
      // });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Reschedule request processed'
      });
    }
    
    // No action needed
    console.log(`[EvolutionWebhook] No action needed for message: "${messageText}"`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Message received, no action needed'
    });
    
  } catch (error) {
    console.error('[EvolutionWebhook] Error processing webhook:', error);
    
    // Always return 200 to Evolution API to avoid retries
    return res.status(200).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Register webhook route in Express app
 */
export function registerEvolutionWebhook(app: any) {
  app.post('/api/webhook/evolution', handleEvolutionWebhook);
  console.log('[EvolutionWebhook] Route registered: POST /api/webhook/evolution');
}
