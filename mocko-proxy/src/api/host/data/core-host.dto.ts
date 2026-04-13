import { Host } from "../../../definitions/data/host";

export class CoreHostDto {
    private constructor(
        public readonly slug: string,
        public readonly name: string | undefined,
        public readonly source: string,
        public readonly destination: string,
    ) { }

    static ofHost(host: Host): CoreHostDto {
        return new CoreHostDto(
            host.slug,
            host.name,
            host.source,
            host.destination,
        );
    }
}
