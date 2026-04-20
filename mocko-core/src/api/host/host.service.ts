import { Service } from "../../utils/decorators/service";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { CoreHostDto } from "./data/core-host.dto";

@Service()
export class HostService {
    constructor(
        private readonly definitionProvider: DefinitionProvider,
    ) { }

    async listHosts(): Promise<CoreHostDto[]> {
        const hosts = await this.definitionProvider.getFileHosts();
        return hosts.map((host) => CoreHostDto.ofHost(host));
    }
}
