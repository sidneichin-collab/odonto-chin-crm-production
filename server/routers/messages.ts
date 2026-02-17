/**
 * Messages Router - Real DB + Evolution API Integration
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as channelsDb from "../channelsDb";
import * as evolutionApi from "../evolutionApiService";

export const messagesRouter = router({
  // Send message via channel
  send: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        recipientPhone: z.string(),
        messageContent: z.string(),
        messageType: z.enum(["reminder", "confirmation", "marketing", "followup", "rescheduling", "other"]),
        appointmentId: z.number().optional(),
        patientId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const channel = await channelsDb.getChannelById(input.channelId);
      
      if (!channel) {
        throw new Error("Channel not found");
      }

      if (!channel.isConnected || !channel.instanceId) {
        throw new Error("Channel is not connected");
      }

      const apiUrl = process.env.EVOLUTION_API_URL;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error("Evolution API credentials not configured");
      }

      const logId = await channelsDb.logMessage({
        channelId: input.channelId,
        appointmentId: input.appointmentId,
        patientId: input.patientId,
        messageType: input.messageType,
        messageContent: input.messageContent,
        recipientPhone: input.recipientPhone,
        status: "pending",
      });

      try {
        const result = await evolutionApi.sendMessage(
          channel.instanceId,
          input.recipientPhone,
          input.messageContent,
          apiUrl,
          apiKey
        );

        await channelsDb.updateMessageStatus(logId, "sent");
        await channelsDb.updateChannel(input.channelId, {
          dailyMessageCount: (channel.dailyMessageCount || 0) + 1,
        });

        return {
          success: true,
          messageId: result.key.id,
          status: "sent",
          deliveryTimestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        await channelsDb.updateMessageStatus(logId, "failed", error.message);
        throw new Error(`Failed to send message: ${error.message}`);
      }
    }),

  // Get message log
  getLog: protectedProcedure
    .input(
      z.object({
        channelId: z.number().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      if (!input.channelId) {
        return { messages: [], total: 0, hasMore: false };
      }

      const messages = await channelsDb.getMessageLog(input.channelId, input.limit);
      
      return {
        messages,
        total: messages.length,
        hasMore: messages.length >= input.limit,
      };
    }),

  // Get message statistics
  getStats: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = input.endDate ? new Date(input.endDate) : new Date();

      const stats = await channelsDb.getMessageStats(input.channelId, start, end);

      return {
        totalSent: stats.sent || 0,
        totalDelivered: stats.delivered || 0,
        totalRead: stats.read || 0,
        totalFailed: stats.failed || 0,
        totalResponses: stats.responses || 0,
        deliveryRate: stats.total ? ((stats.delivered || 0) / stats.total) * 100 : 0,
        readRate: stats.delivered ? ((stats.read || 0) / stats.delivered) * 100 : 0,
        responseRate: stats.delivered ? ((stats.responses || 0) / stats.delivered) * 100 : 0,
      };
    }),
});
