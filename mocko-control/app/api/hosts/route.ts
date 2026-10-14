import { jsonResponse, parseRequestBody, route } from "@/lib/http";
import { computeHostConflicts } from "@/lib/host/host-conflicts";
import { hostService } from "@/lib/host/host.service";
import { HostDto } from "@/lib/types/host-dtos";
import { createHostSchema } from "@/lib/validation/host.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const hosts = await hostService.listHosts();
  const conflicts = computeHostConflicts(hosts);
  return hosts.map((host) =>
    HostDto.ofHost(host, conflicts.get(host.id)?.role),
  );
});

export const POST = route(async (request) => {
  const body = await parseRequestBody(request, createHostSchema);
  const host = await hostService.createHost(body);
  return jsonResponse(HostDto.ofHost(host), 201);
});
