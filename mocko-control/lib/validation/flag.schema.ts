import { z } from "zod";

export const putFlagSchema = z.object({
  value: z.string(),
});

export type PutFlagInput = z.infer<typeof putFlagSchema>;
