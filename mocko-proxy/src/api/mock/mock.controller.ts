import * as Boom from "@hapi/boom";
import * as Hapi from '@hapi/hapi';
import { Provider } from "../../utils/decorators/provider";
import { CoreMockDto, CoreMockDetailsDto } from "./data/core-mock.dto";
import { MockService } from "./mock.service";

@Provider()
export class MockController {
    constructor(
        private readonly service: MockService,
    ) { }

    async listMocks(_request: Hapi.Request): Promise<CoreMockDto[]> {
        return await this.service.listMocks();
    }

    async getMockById(request: Hapi.Request): Promise<CoreMockDetailsDto> {
        const id = String(request.params['id'] || '');
        const mock = await this.service.getMockById(id);

        if(!mock) {
            throw Boom.notFound(`Mock "${id}" was not found`);
        }

        return mock;
    }
}
