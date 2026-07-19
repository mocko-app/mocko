import type { Callback, CallbackMethod } from "@/lib/types/callback";

export type CreateCallbackDto = {
  slug: string;
  name?: string;
  method?: CallbackMethod;
  host?: string;
  path?: string;
  url?: string;
  delay?: number;
  headers?: Record<string, string>;
  body?: string;
};

export type PatchCallbackDto = {
  name?: string;
  method?: CallbackMethod;
  host?: string;
  path?: string;
  url?: string;
  delay?: number;
  headers?: Record<string, string>;
  body?: string;
};

export type FireCallbackDto = {
  payload?: unknown;
};

export type PendingCallbackDto = {
  id: string;
  slug: string;
  payload: unknown;
  dueAt: number;
  createdAt: number;
  triggeredByMockId?: string;
};

export type PendingCallbacksDto = {
  isSupported: boolean;
  pending: PendingCallbackDto[];
};

export class CallbackDto {
  private constructor(
    public readonly slug: string,
    public readonly name: string | undefined,
    public readonly method: CallbackMethod,
    public readonly host: string | undefined,
    public readonly path: string | undefined,
    public readonly url: string | undefined,
    public readonly delay: number,
    public readonly headers: Record<string, string>,
    public readonly body: string | undefined,
    public readonly annotations: Callback["annotations"],
  ) {}

  static ofCallback(callback: Callback): CallbackDto {
    return new CallbackDto(
      callback.slug,
      callback.name,
      callback.method,
      callback.host,
      callback.path,
      callback.url,
      callback.delay,
      { ...callback.headers },
      callback.body,
      [...callback.annotations],
    );
  }
}
