import { ServerRoute } from "@hapi/hapi";
import { Provider } from "../../utils/decorators/provider";
import { IRouter } from "../../utils/router";
import { HostController } from "./host.controller";

@Provider()
export class HostRouter implements IRouter {
    constructor(
        private readonly controller: HostController,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        return [{
            method: 'GET',
            path: '/__mocko__/hosts',
            handler: this.controller.listHosts.bind(this.controller),
            rules: {
                mapSilently: true,
            },
        }];
    }
}

