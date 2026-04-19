import { z } from "zod";
import { HTTP_METHODS } from "@/lib/types/mock";

const RESERVED_PREFIX = "/__mocko__";

function normalizePath(path: string): string {
  const trimmed = path.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function isReservedPath(path: string): boolean {
  return path === RESERVED_PREFIX || path.startsWith(`${RESERVED_PREFIX}/`);
}

const pathSchema = z
  .string()
  .trim()
  .min(1, "Path is required")
  .transform(normalizePath)
  .refine((path) => !isReservedPath(path), {
    message: 'Path cannot start with "/__mocko__/"',
  });

const headersSchema = z.record(z.string(), z.string());
const hostSchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z0-9_-]{1,12}$/,
    "Host must use letters, numbers, hyphens, or underscores, up to 12 characters",
  );

const responseSchema = z.object({
  code: z
    .number({
      error: "Response code must be a number",
    })
    .int("Response code must be an integer")
    .min(200, "Response code must be at least 200")
    .max(599, "Response code must be at most 599"),
  delay: z
    .number({
      error: "Response delay must be a number",
    })
    .int("Response delay must be an integer")
    .min(0, "Response delay must be at least 0")
    .max(300000, "Response delay must be at most 300000")
    .optional(),
  body: z.string().optional(),
  headers: headersSchema.default({}),
});

export const createMockSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters"),
  method: z.enum(HTTP_METHODS),
  path: pathSchema,
  host: hostSchema.nullable().optional(),
  labels: z.array(z.string()).optional().default([]),
  response: responseSchema,
});

export const patchMockSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(255, "Name must be at most 255 characters")
      .optional(),
    method: z.enum(HTTP_METHODS).optional(),
    path: pathSchema.optional(),
    host: hostSchema.nullable().optional(),
    labels: z.array(z.string()).optional(),
    response: responseSchema.optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.method !== undefined ||
      value.path !== undefined ||
      value.host !== undefined ||
      value.labels !== undefined ||
      value.response !== undefined ||
      value.isEnabled !== undefined,
    {
      message: "Patch body must include at least one field",
    },
  );

export type CreateMockInput = z.infer<typeof createMockSchema>;
export type PatchMockInput = z.infer<typeof patchMockSchema>;
