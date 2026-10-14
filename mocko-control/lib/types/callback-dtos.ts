import { annotationsWithConflict } from "@/lib/conflict/conflicts";
import type { Callback, CallbackMethod } from "@/lib/types/callback";
import type {
  ConflictDto,
  ConflictOrigin,
  ConflictRole,
} from "@/lib/types/conflict-dtos";
import type { DisplayMockAnnotation } from "@/lib/types/mock";

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

export type CallbackSummaryDto = {
  id: string;
  slug: string;
  name?: string;
  method: CallbackMethod;
  filePath?: string;
  origin: ConflictOrigin;
};

export type CallbackConflictDto = ConflictDto<CallbackSummaryDto>;

export class CallbackDto {
  private constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string | undefined,
    public readonly method: CallbackMethod,
    public readonly host: string | undefined,
    public readonly path: string | undefined,
    public readonly url: string | undefined,
    public readonly delay: number,
    public readonly headers: Record<string, string>,
    public readonly body: string | undefined,
    public readonly filePath: string | undefined,
    public readonly annotations: DisplayMockAnnotation[],
  ) {}

  static ofCallback(
    callback: Callback,
    conflictRole?: ConflictRole,
  ): CallbackDto {
    return new CallbackDto(
      callback.id,
      callback.slug,
      callback.name,
      callback.method,
      callback.host,
      callback.path,
      callback.url,
      callback.delay,
      { ...callback.headers },
      callback.body,
      callback.filePath,
      annotationsWithConflict(callback.annotations, conflictRole),
    );
  }
}

export class CallbackDetailsDto {
  private constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string | undefined,
    public readonly method: CallbackMethod,
    public readonly host: string | undefined,
    public readonly path: string | undefined,
    public readonly url: string | undefined,
    public readonly delay: number,
    public readonly headers: Record<string, string>,
    public readonly body: string | undefined,
    public readonly filePath: string | undefined,
    public readonly annotations: DisplayMockAnnotation[],
    public readonly conflict: CallbackConflictDto | null,
  ) {}

  static ofCallback(
    callback: Callback,
    conflict: CallbackConflictDto | null = null,
  ): CallbackDetailsDto {
    return new CallbackDetailsDto(
      callback.id,
      callback.slug,
      callback.name,
      callback.method,
      callback.host,
      callback.path,
      callback.url,
      callback.delay,
      { ...callback.headers },
      callback.body,
      callback.filePath,
      annotationsWithConflict(callback.annotations, conflict?.role),
      conflict,
    );
  }
}
