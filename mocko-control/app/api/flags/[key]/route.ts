import { HttpResponseError, parseRequestBody, route } from "@/lib/http";
import { flagService } from "@/lib/flag/flag.service";
import {
  getFlagKeyValidationError,
  putFlagSchema,
} from "@/lib/validation/flag.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

export const GET = route(async (_request, context: RouteContext) => {
  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  return flagService.getFlag(key);
});

export const PUT = route(async (request, context: RouteContext) => {
  const body = await parseRequestBody(request, putFlagSchema);

  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  const keyError = getFlagKeyValidationError(key);
  if (keyError) {
    throw HttpResponseError.badRequest(keyError);
  }

  return flagService.setFlag(key, body);
});

export const DELETE = route(async (_request, context: RouteContext) => {
  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  await flagService.deleteFlag(key);
});
