import { z } from "zod";

const HOST_SLUG_REGEX = /^[a-zA-Z0-9_-]{1,12}$/;

const hostSlugSchema = z
  .string()
  .trim()
  .regex(
    HOST_SLUG_REGEX,
    "Slug must use letters, numbers, hyphens, or underscores, up to 12 characters",
  );

const hostNameSchema = z
  .string()
  .trim()
  .max(255, "Name must be at most 255 characters")
  .optional();

const optionalDestinationSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.url("Destination must be a valid URL").optional());

const patchDestinationSchema = z.preprocess((value) => {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.url("Destination must be a valid URL").nullable().optional());

export const createHostSchema = z.object({
  slug: hostSlugSchema,
  name: hostNameSchema,
  source: z.string().trim().min(1, "Source is required"),
  destination: optionalDestinationSchema,
});

export const patchHostSchema = z
  .object({
    name: hostNameSchema,
    source: z.string().trim().min(1, "Source is required").optional(),
    destination: patchDestinationSchema,
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.source !== undefined ||
      value.destination !== undefined,
    {
      message: "Patch body must include at least one field",
    },
  );

export type CreateHostInput = z.infer<typeof createHostSchema>;
export type PatchHostInput = z.infer<typeof patchHostSchema>;
