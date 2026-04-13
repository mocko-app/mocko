import * as Hapi from '@hapi/hapi';
import { Provider } from "../../utils/decorators/provider";
import { DeployService } from "../deploy/deploy.service";
import { CoreHostDto } from "./data/core-host.dto";
import { HostService } from "./host.service";

@Provider()
export class HostController {
    constructor(
        private readonly service: HostService,
        private readonly deployService: DeployService,
    ) { }

    async listHosts(request: Hapi.Request): Promise<CoreHostDto[]> {
        this.deployService.authorize(request.headers.authorization);
        return await this.service.listHosts();
    }
}

