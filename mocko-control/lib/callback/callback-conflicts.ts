import {
  computeConflicts,
  originOf,
  resolveConflict,
  type Conflict,
} from "@/lib/conflict/conflicts";
import type { Callback } from "@/lib/types/callback";
import type {
  CallbackConflictDto,
  CallbackSummaryDto,
} from "@/lib/types/callback-dtos";

export function computeCallbackConflicts(
  callbacks: Callback[],
): Map<string, Conflict> {
  return computeConflicts(callbacks, (callback) => callback.slug.toLowerCase());
}

export function toCallbackSummary(callback: Callback): CallbackSummaryDto {
  return {
    id: callback.id,
    slug: callback.slug,
    name: callback.name,
    method: callback.method,
    filePath: callback.filePath,
    origin: originOf(callback),
  };
}

export function resolveCallbackConflict(
  callbackId: string,
  conflicts: Map<string, Conflict>,
  callbacks: Callback[],
): CallbackConflictDto | null {
  return resolveConflict(callbackId, conflicts, callbacks, toCallbackSummary);
}
