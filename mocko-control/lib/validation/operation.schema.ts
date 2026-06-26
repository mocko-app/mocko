import { z } from "zod";

const staleFlagsOperationSchema = z.object({
  type: z.literal("STALE_FLAGS"),
  staleFlagsData: z.object({
    thresholdSeconds: z
      .number({ error: "Threshold must be a number of seconds" })
      .int("Threshold must be an integer number of seconds")
      .min(1, "Threshold must be at least 1 second"),
  }),
});

const matchingFlagsOperationSchema = z
  .object({
    type: z.literal("MATCHING_FLAGS"),
    matchingFlagsData: z.object({
      mode: z.enum(["PREFIX", "CONTAINS", "REGEX"]),
      pattern: z.string().min(1, "Pattern is required"),
    }),
  })
  .superRefine((input, context) => {
    if (input.matchingFlagsData.mode !== "REGEX") {
      return;
    }

    try {
      new RegExp(input.matchingFlagsData.pattern);
    } catch {
      context.addIssue({
        code: "custom",
        path: ["matchingFlagsData", "pattern"],
        message: "Invalid regular expression",
      });
    }
  });

export const createOperationSchema = z.discriminatedUnion("type", [
  staleFlagsOperationSchema,
  matchingFlagsOperationSchema,
]);

export const patchOperationSchema = z.object({
  status: z.literal("EXECUTING"),
});

export type CreateOperationInput = z.infer<typeof createOperationSchema>;
export type PatchOperationInput = z.infer<typeof patchOperationSchema>;
