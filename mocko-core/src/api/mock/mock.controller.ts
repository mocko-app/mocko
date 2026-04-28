import * as Boom from "@hapi/boom";
import * as Hapi from '@hapi/hapi';
import { Provider } from "../../utils/decorators/provider";
import { firstString } from "../../utils/utils";
import { CoreMockDto, CoreMockDetailsDto } from "./data/core-mock.dto";
import { MockService } from "./mock.service";
import { DeployService } from "../deploy/deploy.service";

@Provider()
export class MockController {
    constructor(
        private readonly service: MockService,
        private readonly deployService: DeployService,
    ) { }

    async listMocks(request: Hapi.Request): Promise<CoreMockDto[]> {
        this.deployService.authorizeManagement(request.headers.authorization);
        return await this.service.listMocks();
    }

    async getMockById(request: Hapi.Request): Promise<CoreMockDetailsDto> {
        this.deployService.authorizeManagement(request.headers.authorization);
        const id = firstString(request.params['id']);
        const mock = await this.service.getMockById(id);

        if(!mock) {
            throw Boom.notFound(`Mock "${id}" was not found`);
        }

        return mock;
    }
}
