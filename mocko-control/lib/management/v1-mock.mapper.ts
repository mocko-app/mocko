import { $template } from "bigodon/dist/parser";
import { State } from "pierrejs";
import type { HttpMethod, Mock } from "@/lib/types/mock";

type V1Mock = {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  response?: {
    code?: number;
    body?: string;
    headers?: Record<string, string>;
  };
  isEnabled?: boolean;
};

export function toV2Mock(v1: V1Mock): Mock {
  return {
    id: v1.id,
    name: v1.name,
    method: v1.method,
    path: v1.path,
    response: {
      code: v1.response?.code ?? 200,
      body: v1.response?.body,
      headers: { ...(v1.response?.headers ?? {}) },
    },
    isEnabled: v1.isEnabled ?? true,
    labels: [],
    annotations: isTemplateValid(v1.response?.body) ? [] : ["INVALID_TEMPLATE"],
  };
}

function isTemplateValid(body?: string): boolean {
  if (!body) {
    return true;
  }

  return !$template.applyTo(State.of(body)).error;
}
