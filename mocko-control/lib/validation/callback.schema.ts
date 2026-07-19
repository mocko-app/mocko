import { z } from "zod";
import { CALLBACK_METHODS } from "@/lib/types/callback";

const CALLBACK_SLUG_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

const callbackSlugSchema = z
  .string()
  .trim()
  .regex(
    CALLBACK_SLUG_REGEX,
    "Slug must use letters, numbers, hyphens, or underscores, up to 64 characters",
  );

const callbackNameSchema = z
  .string()
  .trim()
  .max(255, "Name must be at most 255 characters")
  .optional();

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const optionalUrlSchema = z.preprocess(
  emptyToUndefined,
  z
    .url("URL must be a valid URL")
    .regex(/^https?:\/\//, "URL must be an absolute http:// or https:// URL")
    .optional(),
);

type TargetFields = {
  host?: string;
  path?: string;
  url?: string;
};

function validateTarget(value: TargetFields, ctx: z.RefinementCtx): void {
  if (value.url && (value.host || value.path)) {
    ctx.addIssue({
      code: "custom",
      path: ["url"],
      message: "Target must be either a host with a path or a URL, not both",
    });
    return;
  }

  if (!value.url && !value.host && !value.path) {
    ctx.addIssue({
      code: "custom",
      path: ["host"],
      message: "Target must be either a host with a path or a URL",
    });
    return;
  }

  if (value.host && !value.path) {
    ctx.addIssue({
      code: "custom",
      path: ["path"],
      message: "Path is required when targeting a host",
    });
  }

  if (value.path && !value.host) {
    ctx.addIssue({
      code: "custom",
      path: ["host"],
      message: "Host is required when a path is set",
    });
  }
}

const targetFields = {
  method: z.enum(CALLBACK_METHODS).default("POST"),
  host: z.preprocess(emptyToUndefined, z.string().optional()),
  path: z.preprocess(emptyToUndefined, z.string().optional()),
  url: optionalUrlSchema,
  delay: z
    .number("Delay must be a number")
    .int("Delay must be an integer")
    .min(0, "Delay must be zero or greater")
    .default(0),
  headers: z.record(z.string(), z.string()).default({}),
  body: z.string().optional(),
};

export const createCallbackSchema = z
  .object({
    slug: callbackSlugSchema,
    name: callbackNameSchema,
    ...targetFields,
  })
  .superRefine(validateTarget);

export const patchCallbackSchema = z
  .object({
    name: callbackNameSchema,
    ...targetFields,
  })
  .superRefine(validateTarget);

export const fireCallbackSchema = z.object({
  payload: z.unknown().optional(),
  delay: z
    .number("Delay must be a number")
    .int("Delay must be an integer")
    .min(0, "Delay must be zero or greater")
    .optional(),
});

export type CreateCallbackInput = z.infer<typeof createCallbackSchema>;
export type PatchCallbackInput = z.infer<typeof patchCallbackSchema>;
export type FireCallbackInput = z.infer<typeof fireCallbackSchema>;
