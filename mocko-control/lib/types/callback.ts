import type { MockAnnotation } from "@/lib/types/mock";

export const CALLBACK_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;
export type CallbackMethod = (typeof CALLBACK_METHODS)[number];

export type Callback = {
  slug: string;
  name?: string;
  method: CallbackMethod;
  host?: string;
  path?: string;
  url?: string;
  delay: number;
  headers: Record<string, string>;
  body?: string;
  annotations: MockAnnotation[];
};
