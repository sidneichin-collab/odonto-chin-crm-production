/**
 * Anti-Block Router - Real DB Integration
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as channelsDb from "../channelsDb";

export const antiblockRouter = router({
  // Get antiblock configuration
  getConfig: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      let config = await channelsDb.getAntiblockConfig(input.channelId);
      
      if (!config) {
        await channelsDb.createAntiblockConfig({ channelId: input.channelId });
        config = await channelsDb.getAntiblockConfig(input.channelId);
      }

      return config;
    }),

  // Update antiblock configuration
  updateConfig: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        enabled: z.boolean().optional(),
        dailyLimit: z.number().optional(),
        hourlyLimit: z.number().optional(),
        minIntervalSeconds: z.number().optional(),
        maxIntervalSeconds: z.number().optional(),
        burstLimit: z.number().optional(),
        burstWindowSeconds: z.number().optional(),
        cooldownMinutes: z.number().optional(),
        autoRotateOnLimit: z.boolean().optional(),
        autoPauseOnBlock: z.boolean().optional(),
        pauseThresholdHealth: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, ...data } = input;

      await channelsDb.updateAntiblockConfig(channelId, {
        enabled: data.enabled !== undefined ? (data.enabled ? 1 : 0) : undefined,
        dailyLimit: data.dailyLimit,
        hourlyLimit: data.hourlyLimit,
        minIntervalSeconds: data.minIntervalSeconds,
        maxIntervalSeconds: data.maxIntervalSeconds,
        burstLimit: data.burstLimit,
        burstWindowSeconds: data.burstWindowSeconds,
        cooldownMinutes: data.cooldownMinutes,
        autoRotateOnLimit: data.autoRotateOnLimit !== undefined ? (data.autoRotateOnLimit ? 1 : 0) : undefined,
        autoPauseOnBlock: data.autoPauseOnBlock !== undefined ? (data.autoPauseOnBlock ? 1 : 0) : undefined,
        pauseThresholdHealth: data.pauseThresholdHealth,
      });

      return { success: true, message: "Configuration updated successfully" };
    }),

  // Check if channel can send message
  checkLimits: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const config = await channelsDb.getAntiblockConfig(input.channelId);
      const channel = await channelsDb.getChannelById(input.channelId);

      if (!config || !channel) {
        return { canSend: false, reason: "Channel or config not found", dailyCount: 0, dailyLimit: 0, dailyRemaining: 0, hourlyCount: 0, hourlyLimit: 0, hourlyRemaining: 0, nextAvailableAt: null };
      }

      if (!config.enabled) {
        return { canSend: true, dailyCount: channel.dailyMessageCount || 0, dailyLimit: config.dailyLimit || 1000, dailyRemaining: (config.dailyLimit || 1000) - (channel.dailyMessageCount || 0), hourlyCount: 0, hourlyLimit: config.hourlyLimit || 100, hourlyRemaining: config.hourlyLimit || 100, nextAvailableAt: null, reason: null };
      }

      const dailyCount = channel.dailyMessageCount || 0;
      const dailyLimit = config.dailyLimit || 1000;

      if (dailyCount >= dailyLimit) {
        return { canSend: false, reason: "Daily limit reached", dailyCount, dailyLimit, dailyRemaining: 0, hourlyCount: 0, hourlyLimit: config.hourlyLimit || 100, hourlyRemaining: 0, nextAvailableAt: null };
      }

      if (config.pauseThresholdHealth && channel.healthScore < config.pauseThresholdHealth) {
        return { canSend: false, reason: "Health score too low", dailyCount, dailyLimit, dailyRemaining: dailyLimit - dailyCount, hourlyCount: 0, hourlyLimit: config.hourlyLimit || 100, hourlyRemaining: 0, nextAvailableAt: null };
      }

      return { canSend: true, dailyCount, dailyLimit, dailyRemaining: dailyLimit - dailyCount, hourlyCount: 0, hourlyLimit: config.hourlyLimit || 100, hourlyRemaining: config.hourlyLimit || 100, nextAvailableAt: null, reason: null };
    }),

  // Reset counters
  resetCounters: protectedProcedure
    .input(z.object({ channelId: z.number().optional() }))
    .mutation(async ({ input }) => {
      if (input.channelId) {
        await channelsDb.updateChannel(input.channelId, {
          dailyMessageCount: 0,
        });
        return { success: true, message: `Counters reset for channel ${input.channelId}`, resetAt: new Date().toISOString() };
      }

      const clinicId = 1;
      const channels = await channelsDb.getAllChannels(clinicId);
      
      for (const channel of channels) {
        await channelsDb.updateChannel(channel.id, {
          dailyMessageCount: 0,
        });
      }

      return { success: true, message: "Counters reset for all channels", resetAt: new Date().toISOString() };
    }),
});
