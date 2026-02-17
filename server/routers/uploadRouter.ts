import { router, publicProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

export const uploadRouter = router({
  uploadCedula: publicProcedure
    .mutation(async ({ ctx }) => {
      // This will be called from a regular fetch POST with FormData
      // The actual file handling happens in the Express route
      throw new TRPCError({
        code: "METHOD_NOT_SUPPORTED",
        message: "Use /api/upload-cedula endpoint directly",
      });
    }),
});
