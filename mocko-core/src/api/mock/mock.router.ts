import {IRouter} from "../../utils/router";
import {Provider} from "../../utils/decorators/provider";
import { ServerRoute } from "@hapi/hapi";
import { MockController } from "./mock.controller";
import {MockService} from "./mock.service";

@Provider()
export class MockRouter implements IRouter {
    constructor(
        private readonly controller: MockController,
        private readonly service: MockService,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        const mockRoutes = await this.service.getMockRoutes();

        return [
            {
                method: 'GET',
                path: '/__mocko__/mocks',
                handler: this.controller.listMocks.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'GET',
                path: '/__mocko__/mocks/{id}',
                handler: this.controller.getMockById.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            ...mockRoutes,
        ];
    }
}
