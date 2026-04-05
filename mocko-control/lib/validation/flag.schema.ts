import { z } from "zod";

export const createFlagSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string(),
});

export const patchFlagSchema = z.object({
  value: z.string(),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
export type PatchFlagInput = z.infer<typeof patchFlagSchema>;
