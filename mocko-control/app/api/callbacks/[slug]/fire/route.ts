import { jsonResponse, parseRequestBody, route } from "@/lib/http";
import { callbackService } from "@/lib/callback/callback.service";
import { fireCallbackSchema } from "@/lib/validation/callback.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const POST = route(async (request, context: RouteContext) => {
  const body = await parseRequestBody(request, fireCallbackSchema);
  const { slug } = await context.params;
  const pending = await callbackService.fire(slug, body.payload, body.delay);
  return jsonResponse(pending, 202);
});
