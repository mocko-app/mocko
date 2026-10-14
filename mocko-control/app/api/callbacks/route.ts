import { jsonResponse, parseRequestBody, route } from "@/lib/http";
import { computeCallbackConflicts } from "@/lib/callback/callback-conflicts";
import { callbackService } from "@/lib/callback/callback.service";
import { CallbackDto } from "@/lib/types/callback-dtos";
import { createCallbackSchema } from "@/lib/validation/callback.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const callbacks = await callbackService.listCallbacks();
  const conflicts = computeCallbackConflicts(callbacks);
  return callbacks.map((callback) =>
    CallbackDto.ofCallback(callback, conflicts.get(callback.id)?.role),
  );
});

export const POST = route(async (request) => {
  const body = await parseRequestBody(request, createCallbackSchema);
  const callback = await callbackService.createCallback(body);
  return jsonResponse(CallbackDto.ofCallback(callback), 201);
});
