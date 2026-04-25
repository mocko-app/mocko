import { z } from "zod";

export const createOperationSchema = z.object({
  type: z.literal("STALE_FLAGS"),
  staleFlagsData: z.object({
    thresholdSeconds: z
      .number({ error: "Threshold must be a number of seconds" })
      .int("Threshold must be an integer number of seconds")
      .min(1, "Threshold must be at least 1 second"),
  }),
});

export const patchOperationSchema = z.object({
  status: z.literal("EXECUTING"),
});

export type CreateOperationInput = z.infer<typeof createOperationSchema>;
export type PatchOperationInput = z.infer<typeof patchOperationSchema>;
