import {
  computeConflicts,
  originOf,
  resolveConflict,
  type Conflict,
} from "@/lib/conflict/conflicts";
import type { Host } from "@/lib/types/host";
import type { HostConflictDto, HostSummaryDto } from "@/lib/types/host-dtos";

export function computeHostConflicts(hosts: Host[]): Map<string, Conflict> {
  return computeConflicts(hosts, (host) => host.slug.toLowerCase());
}

export function toHostSummary(host: Host): HostSummaryDto {
  return {
    id: host.id,
    slug: host.slug,
    name: host.name,
    source: host.source,
    destination: host.destination,
    filePath: host.filePath,
    origin: originOf(host),
  };
}

export function resolveHostConflict(
  hostId: string,
  conflicts: Map<string, Conflict>,
  hosts: Host[],
): HostConflictDto | null {
  return resolveConflict(hostId, conflicts, hosts, toHostSummary);
}
