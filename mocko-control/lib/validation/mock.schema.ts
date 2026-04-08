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

const responseSchema = z.object({
  code: z
    .number({
      error: "Response code must be a number",
    })
    .int("Response code must be an integer")
    .min(200, "Response code must be at least 200")
    .max(599, "Response code must be at most 599"),
  body: z.string().optional(),
  headers: headersSchema.default({}),
});

const responsePatchSchema = z
  .object({
    code: z
      .number({
        error: "Response code must be a number",
      })
      .int("Response code must be an integer")
      .min(200, "Response code must be at least 200")
      .max(599, "Response code must be at most 599")
      .optional(),
    body: z.string().optional(),
    headers: headersSchema.optional(),
  })
  .refine(
    (value) =>
      value.code !== undefined ||
      value.body !== undefined ||
      value.headers !== undefined,
    {
      message: "Response patch must include at least one field",
    },
  );

export const createMockSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters"),
  method: z.enum(HTTP_METHODS),
  path: pathSchema,
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
    labels: z.array(z.string()).optional(),
    response: responsePatchSchema.optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.method !== undefined ||
      value.path !== undefined ||
      value.labels !== undefined ||
      value.response !== undefined ||
      value.isEnabled !== undefined,
    {
      message: "Patch body must include at least one field",
    },
  );

export type CreateMockInput = z.infer<typeof createMockSchema>;
export type PatchMockInput = z.infer<typeof patchMockSchema>;
