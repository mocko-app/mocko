import { HttpResponseError, route, tryCatch } from "@/lib/http";
import { callbackService } from "@/lib/callback/callback.service";
import { CallbackDto } from "@/lib/types/callback-dtos";
import { patchCallbackSchema } from "@/lib/validation/callback.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const GET = route(async (_request, context: RouteContext) => {
  const { slug } = await context.params;
  const callback = await callbackService.getCallback(slug);
  return CallbackDto.ofCallback(callback);
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

  const { slug } = await context.params;
  const callback = await callbackService.updateCallback(slug, body);
  return CallbackDto.ofCallback(callback);
});

export const DELETE = route(async (_request, context: RouteContext) => {
  const { slug } = await context.params;
  await callbackService.deleteCallback(slug);
});
