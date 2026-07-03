import { HttpResponseError, route, tryCatch } from "@/lib/http";
import { hostService } from "@/lib/host/host.service";
import { HostDto } from "@/lib/types/host-dtos";
import { patchHostSchema } from "@/lib/validation/host.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const GET = route(async (_request, context: RouteContext) => {
  const { slug } = await context.params;
  const host = await hostService.getHost(slug);
  return HostDto.ofHost(host);
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

  const body = patchHostSchema.parse(payload);

  const { slug } = await context.params;
  const host = await hostService.updateHost(slug, body);
  return HostDto.ofHost(host);
});

export const DELETE = route(async (_request, context: RouteContext) => {
  const { slug } = await context.params;
  await hostService.deleteHost(slug);
});
