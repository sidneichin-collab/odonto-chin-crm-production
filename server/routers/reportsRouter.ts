import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getReminderMetrics, getReminderHistory } from "../db";

export const reportsRouter = router({
  getReminderMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await getReminderMetrics(input.startDate, input.endDate);
      const history = await getReminderHistory(input.startDate, input.endDate, 50);
      
      return {
        ...metrics,
        history,
      };
    }),
});
