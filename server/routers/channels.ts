/**
 * Channels Router - Real Evolution API + DB Integration
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as channelsDb from "../channelsDb";
import * as evolutionApi from "../evolutionApiService";

export const channelsRouter = router({
  // List all channels for clinic
  list: protectedProcedure.query(async ({ ctx }) => {
    const clinicId = 1; // TODO: Get from ctx.user.clinicId
    return channelsDb.getAllChannels(clinicId);
  }),

  // Create new channel
  create: protectedProcedure
    .input(
      z.object({
        channelName: z.string(),
        channelType: z.enum(["whatsapp", "messenger", "n8n", "chatwoot", "email"]),
        purpose: z.enum(["integration", "reminders", "both"]),
        phoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const clinicId = 1; // TODO: Get from ctx.user.clinicId

      const channelId = await channelsDb.createChannel({
        clinicId,
        channelName: input.channelName,
        channelType: input.channelType,
        purpose: input.purpose,
        phoneNumber: input.phoneNumber,
        apiUrl: process.env.EVOLUTION_API_URL,
        apiKey: process.env.EVOLUTION_API_KEY,
      });

      await channelsDb.createAntiblockConfig({ channelId });

      return { id: channelId, message: "Channel created successfully" };
    }),

  // Update channel
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        channelName: z.string().optional(),
        phoneNumber: z.string().optional(),
        status: z.enum(["active", "blocked", "warning", "inactive", "paused"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await channelsDb.updateChannel(input.id, {
        channelName: input.channelName,
        phoneNumber: input.phoneNumber,
        status: input.status,
      });

      return { message: "Channel updated successfully" };
    }),

  // Delete channel
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const channel = await channelsDb.getChannelById(input.id);
      
      if (channel && channel.instanceId) {
        try {
          await evolutionApi.disconnectInstance(
            channel.instanceId,
            process.env.EVOLUTION_API_URL!,
            process.env.EVOLUTION_API_KEY!
          );
        } catch (error) {
          console.error("Failed to disconnect instance:", error);
        }
      }

      await channelsDb.deleteChannel(input.id);
      return { message: "Channel deleted successfully" };
    }),

  // Connect channel (generate QR code)
  connect: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const channel = await channelsDb.getChannelById(input.id);
      
      if (!channel) {
        throw new Error("Channel not found");
      }

      if (channel.channelType !== "whatsapp") {
        throw new Error("Only WhatsApp channels can be connected via QR code");
      }

      const apiUrl = process.env.EVOLUTION_API_URL;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error("Evolution API credentials not configured");
      }

      try {
        const instanceName = `clinic_${channel.clinicId}_channel_${channel.id}`;

        await evolutionApi.createInstance(instanceName, apiUrl, apiKey);
        const qrData = await evolutionApi.getQRCode(instanceName, apiUrl, apiKey);

        await channelsDb.updateChannel(channel.id, {
          instanceId: instanceName,
          qrCode: qrData.base64,
          connectionStatus: "pending",
        });

        return {
          qrCode: qrData.base64,
          instanceId: instanceName,
          message: "Scan QR code to connect WhatsApp",
        };
      } catch (error: any) {
        await channelsDb.updateChannel(channel.id, {
          connectionStatus: "error",
        });

        throw new Error(`Failed to connect: ${error.message}`);
      }
    }),

  // Disconnect channel
  disconnect: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const channel = await channelsDb.getChannelById(input.id);
      
      if (!channel || !channel.instanceId) {
        throw new Error("Channel not found or not connected");
      }

      const apiUrl = process.env.EVOLUTION_API_URL;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error("Evolution API credentials not configured");
      }

      try {
        await evolutionApi.disconnectInstance(channel.instanceId, apiUrl, apiKey);

        await channelsDb.updateChannel(channel.id, {
          isConnected: 0,
          connectionStatus: "disconnected",
          qrCode: "",
        });

        return { message: "Channel disconnected successfully" };
      } catch (error: any) {
        throw new Error(`Failed to disconnect: ${error.message}`);
      }
    }),

  // Get channel status
  getStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const channel = await channelsDb.getChannelById(input.id);
      
      if (!channel) {
        throw new Error("Channel not found");
      }

      if (!channel.instanceId) {
        return {
          id: channel.id,
          channelName: channel.channelName,
          connectionStatus: "disconnected",
          isConnected: false,
          healthScore: channel.healthScore,
          status: channel.status,
        };
      }

      const apiUrl = process.env.EVOLUTION_API_URL;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error("Evolution API credentials not configured");
      }

      try {
        const status = await evolutionApi.getConnectionStatus(
          channel.instanceId,
          apiUrl,
          apiKey
        );

        const isConnected = status.instance.status === "open";

        await channelsDb.updateChannel(channel.id, {
          isConnected: isConnected ? 1 : 0,
          connectionStatus: isConnected ? "connected" : "disconnected",
        });

        return {
          id: channel.id,
          channelName: channel.channelName,
          connectionStatus: status.instance.status,
          isConnected,
          healthScore: channel.healthScore,
          status: channel.status,
        };
      } catch (error: any) {
        return {
          id: channel.id,
          channelName: channel.channelName,
          connectionStatus: "error",
          isConnected: false,
          healthScore: channel.healthScore,
          status: channel.status,
          error: error.message,
        };
      }
    }),
});
