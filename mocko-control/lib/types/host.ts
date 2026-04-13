import type { MockAnnotation } from "@/lib/types/mock";

export type Host = {
  slug: string;
  name?: string;
  source: string;
  destination: string;
  annotations: MockAnnotation[];
};
