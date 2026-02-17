/**
 * WhatsApp Router - Evolution API Integration
 * Used by: Integraciones.tsx
 * 
 * CRITICAL: DO NOT DELETE OR RENAME without updating frontend
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import * as evolutionApi from '../evolutionApiService';

export const whatsappRouter = router({
  /**
   * Get WhatsApp connection status
   * Returns: { status, qrCode, sessionId }
   */
  getEstado: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const status = await evolutionApi.getInstanceStatus(input.sessionId);
        
        // Try to get QR code if disconnected
        let qrCode = null;
        if (status.state === 'close' || status.state === 'connecting') {
          try {
            const apiUrl = process.env.EVOLUTION_API_URL!;
            const apiKey = process.env.EVOLUTION_API_KEY!;
            const qrData = await evolutionApi.getQRCode(input.sessionId, apiUrl, apiKey);
            qrCode = qrData.base64;
          } catch (error) {
            // QR code not available
          }
        }
        
        return {
          status: status.state === 'open' ? 'connected' : status.state === 'connecting' ? 'qr' : 'disconnected',
          qrCode,
          sessionId: input.sessionId,
        };
      } catch (error) {
        return { status: 'disconnected', qrCode: null, sessionId: input.sessionId };
      }
    }),
  
  /**
   * Initialize WhatsApp instance
   * Tries to restart existing instance, creates new if doesn't exist
   */
  initialize: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const apiUrl = process.env.EVOLUTION_API_URL!;
      const apiKey = process.env.EVOLUTION_API_KEY!;
      
      try {
        // Verificar se instância existe
        try {
          const status = await evolutionApi.getInstanceStatus(input.sessionId);
          
          // Se existe e está desconectada, reiniciar (sem perder credenciais)
          if (status.state === 'close' || status.state === 'connecting') {
            console.log('[WhatsApp] Restarting existing instance:', input.sessionId);
            await evolutionApi.restartInstance(input.sessionId, apiUrl, apiKey);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
          }
          
          // Se já está conectada, apenas buscar QR (pode não ter)
          if (status.state === 'open') {
            return { 
              success: true, 
              qrCode: null,
              status: 'connected'
            };
          }
        } catch (statusError) {
          // Instância não existe, criar nova
          console.log('[WhatsApp] Creating new instance:', input.sessionId);
          await evolutionApi.createInstance(input.sessionId, apiUrl, apiKey);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar 3s
        }
        
        // Buscar QR code
        const qrData = await evolutionApi.getQRCode(input.sessionId, apiUrl, apiKey);
        
        return { 
          success: true, 
          qrCode: qrData.base64,
          status: 'qr'
        };
      } catch (error: any) {
        console.error('[WhatsApp Initialize Error]', error);
        throw new Error(`Failed to initialize WhatsApp: ${error.message}`);
      }
    }),
  
  /**
   * Connect WhatsApp instance
   * Generates QR code for scanning
   */
  connect: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const apiUrl = process.env.EVOLUTION_API_URL!;
      const apiKey = process.env.EVOLUTION_API_KEY!;
      
      // Create instance
      await evolutionApi.createInstance(input.sessionId, apiUrl, apiKey);
      
      // Get QR code
      const qrData = await evolutionApi.getQRCode(input.sessionId, apiUrl, apiKey);
      
      return { success: true, qrCode: qrData.base64 };
    }),
  
  /**
   * Disconnect WhatsApp instance
   */
  disconnect: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const apiUrl = process.env.EVOLUTION_API_URL!;
      const apiKey = process.env.EVOLUTION_API_KEY!;
      
      await evolutionApi.disconnectInstance(input.sessionId, apiUrl, apiKey);
      
      return { success: true };
    }),
  
  /**
   * Send test message
   */
  sendMessage: protectedProcedure
    .input(z.object({ sessionId: z.string(), phone: z.string(), message: z.string() }))
    .mutation(async ({ input }) => {
      const apiUrl = process.env.EVOLUTION_API_URL!;
      const apiKey = process.env.EVOLUTION_API_KEY!;
      
      await evolutionApi.sendMessage(input.sessionId, input.phone, input.message, apiUrl, apiKey);
      return { success: true };
    }),
});
