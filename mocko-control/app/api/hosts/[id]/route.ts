import { HttpResponseError, route, tryCatch } from "@/lib/http";
import {
  computeHostConflicts,
  resolveHostConflict,
} from "@/lib/host/host-conflicts";
import { hostService } from "@/lib/host/host.service";
import { HostDetailsDto } from "@/lib/types/host-dtos";
import { patchHostSchema } from "@/lib/validation/host.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;

  const hosts = await hostService.listHosts();
  const host = await hostService.getHost(id);

  const conflict = resolveHostConflict(id, computeHostConflicts(hosts), hosts);
  return HostDetailsDto.ofHost(host, conflict);
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

  const { id } = await context.params;
  const host = await hostService.updateHost(id, body);

  const [hosts] = await tryCatch(() => hostService.listHosts());
  const conflict = hosts
    ? resolveHostConflict(id, computeHostConflicts(hosts), hosts)
    : null;
  return HostDetailsDto.ofHost(host, conflict);
});

export const DELETE = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  await hostService.deleteHost(id);
});
