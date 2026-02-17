/**
 * Health Monitoring Router - Real DB Integration
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as channelsDb from "../channelsDb";

export const healthRouter = router({
  // Get channel health metrics
  getChannelHealth: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const channel = await channelsDb.getChannelById(input.channelId);
      
      if (!channel) {
        throw new Error("Channel not found");
      }

      const latestMetrics = await channelsDb.getLatestHealthMetrics(input.channelId);
      const alerts = await channelsDb.getUnresolvedAlerts(input.channelId);

      return {
        channelId: channel.id,
        healthScore: channel.healthScore,
        status: channel.status === "active" ? "healthy" : channel.status,
        messagesSent: latestMetrics?.messagesSent || 0,
        messagesDelivered: latestMetrics?.messagesDelivered || 0,
        messagesRead: latestMetrics?.messagesRead || 0,
        messagesFailed: latestMetrics?.messagesFailed || 0,
        responsesReceived: latestMetrics?.responsesReceived || 0,
        deliveryRate: parseFloat(latestMetrics?.deliveryRate || "0"),
        readRate: parseFloat(latestMetrics?.readRate || "0"),
        responseRate: parseFloat(latestMetrics?.responseRate || "0"),
        avgResponseTime: latestMetrics?.avgResponseTime || 0,
        lastUpdated: latestMetrics?.recordedAt || new Date().toISOString(),
      };
    }),

  // Get health history
  getHistory: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        days: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);

      return channelsDb.getHealthHistory(input.channelId, startDate, endDate);
    }),

  // Update health metrics
  updateMetrics: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        messagesSent: z.number(),
        messagesDelivered: z.number(),
        messagesRead: z.number(),
        messagesFailed: z.number(),
        responsesReceived: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const deliveryRate = input.messagesSent > 0 
        ? ((input.messagesDelivered / input.messagesSent) * 100).toFixed(2)
        : "0.00";
      
      const readRate = input.messagesDelivered > 0
        ? ((input.messagesRead / input.messagesDelivered) * 100).toFixed(2)
        : "0.00";
      
      const responseRate = input.messagesRead > 0
        ? ((input.responsesReceived / input.messagesRead) * 100).toFixed(2)
        : "0.00";
      
      const healthScore = Math.floor(
        parseFloat(deliveryRate) * 0.4 +
        parseFloat(readRate) * 0.3 +
        parseFloat(responseRate) * 0.3
      );

      await channelsDb.recordHealthMetrics({
        channelId: input.channelId,
        healthScore,
        messagesSent: input.messagesSent,
        messagesDelivered: input.messagesDelivered,
        messagesRead: input.messagesRead,
        messagesFailed: input.messagesFailed,
        responsesReceived: input.responsesReceived,
        deliveryRate,
        readRate,
        responseRate,
        avgResponseTime: 0,
      });

      await channelsDb.updateChannel(input.channelId, {
        healthScore,
        status: healthScore >= 80 ? "active" : healthScore >= 60 ? "warning" : "blocked",
      });

      return {
        success: true,
        healthScore,
        deliveryRate,
        readRate,
        responseRate,
      };
    }),

  // Get alerts
  getAlerts: protectedProcedure
    .input(z.object({ clinicId: z.number().optional(), resolved: z.boolean().optional() }))
    .query(async ({ input }) => {
      const clinicId = input.clinicId || 1;
      const channels = await channelsDb.getAllChannels(clinicId);
      
      const allAlerts = [];
      
      for (const channel of channels) {
        const alerts = input.resolved === false 
          ? await channelsDb.getUnresolvedAlerts(channel.id)
          : await channelsDb.getAllAlerts(channel.id, 10);
        
        allAlerts.push(...alerts.map(a => ({
          ...a,
          channelName: channel.channelName,
        })));
      }

      return allAlerts;
    }),
});
