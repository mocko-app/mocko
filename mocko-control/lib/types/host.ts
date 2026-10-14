import type { MockAnnotation } from "@/lib/types/mock";

export type Host = {
  id: string;
  slug: string;
  name?: string;
  source: string;
  destination?: string;
  filePath?: string;
  annotations: MockAnnotation[];
};
