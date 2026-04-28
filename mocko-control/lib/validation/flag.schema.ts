import { z } from "zod";

export const putFlagSchema = z.object({
  value: z.string(),
});

export type PutFlagInput = z.infer<typeof putFlagSchema>;

export function isValidFlagKey(key: string): boolean {
  return !key.startsWith(":") && !key.endsWith(":") && !key.includes("::");
}

export function getFlagKeyValidationError(key: string): string | null {
  if (!key.trim()) {
    return "Flag key is required";
  }
  if (!isValidFlagKey(key)) {
    return "Flag key cannot start or end with ':' or contain empty sections like '::'";
  }
  return null;
}
