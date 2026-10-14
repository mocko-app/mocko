import { HttpResponseError, route, tryCatch } from "@/lib/http";
import {
  computeCallbackConflicts,
  resolveCallbackConflict,
} from "@/lib/callback/callback-conflicts";
import { callbackService } from "@/lib/callback/callback.service";
import { CallbackDetailsDto } from "@/lib/types/callback-dtos";
import { patchCallbackSchema } from "@/lib/validation/callback.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;

  const callbacks = await callbackService.listCallbacks();
  const callback = await callbackService.getCallback(id);

  const conflict = resolveCallbackConflict(
    id,
    computeCallbackConflicts(callbacks),
    callbacks,
  );
  return CallbackDetailsDto.ofCallback(callback, conflict);
});

export const PATCH = route(async (request, context: RouteContext) => {
  const [payload, parseError] = await tryCatch(() => request.json());
  if (
    parseError ||
    !payload ||
    Array.isArray(payload) ||
    typeof payload !== "object"
  ) {
    throw HttpResponseError.badRequest("Request body must be valid JSON");
  }

  if ("slug" in payload) {
    throw HttpResponseError.badRequest('Field "slug" cannot be updated');
  }

  const body = patchCallbackSchema.parse(payload);

  const { id } = await context.params;
  const callback = await callbackService.updateCallback(id, body);

  const [callbacks] = await tryCatch(() => callbackService.listCallbacks());
  const conflict = callbacks
    ? resolveCallbackConflict(
        id,
        computeCallbackConflicts(callbacks),
        callbacks,
      )
    : null;
  return CallbackDetailsDto.ofCallback(callback, conflict);
});

export const DELETE = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  await callbackService.deleteCallback(id);
});
