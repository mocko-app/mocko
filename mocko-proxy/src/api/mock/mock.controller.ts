import * as Boom from "@hapi/boom";
import * as Hapi from '@hapi/hapi';
import { Provider } from "../../utils/decorators/provider";
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
        this.deployService.authorize(request.headers.authorization);
        return await this.service.listMocks();
    }

    async getMockById(request: Hapi.Request): Promise<CoreMockDetailsDto> {
        this.deployService.authorize(request.headers.authorization);
        const id = String(request.params['id'] || '');
        const mock = await this.service.getMockById(id);

        if(!mock) {
            throw Boom.notFound(`Mock "${id}" was not found`);
        }

        return mock;
    }
}
