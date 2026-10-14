import { annotationsWithConflict } from "@/lib/conflict/conflicts";
import type {
  ConflictDto,
  ConflictOrigin,
  ConflictRole,
} from "@/lib/types/conflict-dtos";
import type { Host } from "@/lib/types/host";
import type { DisplayMockAnnotation } from "@/lib/types/mock";

export type CreateHostDto = {
  slug: string;
  name?: string;
  source: string;
  destination?: string;
};

export type PatchHostDto = {
  name?: string;
  source?: string;
  destination?: string | null;
};

export type HostSummaryDto = {
  id: string;
  slug: string;
  name?: string;
  source: string;
  destination?: string;
  filePath?: string;
  origin: ConflictOrigin;
};

export type HostConflictDto = ConflictDto<HostSummaryDto>;

export class HostDto {
  private constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string | undefined,
    public readonly source: string,
    public readonly destination: string | undefined,
    public readonly filePath: string | undefined,
    public readonly annotations: DisplayMockAnnotation[],
  ) {}

  static ofHost(host: Host, conflictRole?: ConflictRole): HostDto {
    return new HostDto(
      host.id,
      host.slug,
      host.name,
      host.source,
      host.destination,
      host.filePath,
      annotationsWithConflict(host.annotations, conflictRole),
    );
  }
}

export class HostDetailsDto {
  private constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string | undefined,
    public readonly source: string,
    public readonly destination: string | undefined,
    public readonly filePath: string | undefined,
    public readonly annotations: DisplayMockAnnotation[],
    public readonly conflict: HostConflictDto | null,
  ) {}

  static ofHost(
    host: Host,
    conflict: HostConflictDto | null = null,
  ): HostDetailsDto {
    return new HostDetailsDto(
      host.id,
      host.slug,
      host.name,
      host.source,
      host.destination,
      host.filePath,
      annotationsWithConflict(host.annotations, conflict?.role),
      conflict,
    );
  }
}
