import type { Host } from "@/lib/types/host";

export type CreateHostDto = {
  slug: string;
  name?: string;
  source: string;
  destination: string;
};

export type PatchHostDto = {
  name?: string;
  source?: string;
  destination?: string;
};

export class HostDto {
  private constructor(
    public readonly slug: string,
    public readonly name: string | undefined,
    public readonly source: string,
    public readonly destination: string,
    public readonly annotations: Host["annotations"],
  ) {}

  static ofHost(host: Host): HostDto {
    return new HostDto(host.slug, host.name, host.source, host.destination, [
      ...host.annotations,
    ]);
  }
}
