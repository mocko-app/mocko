import {IRouter} from "../../utils/router";
import {Provider} from "../../utils/decorators/provider";
import {HealthController} from "./health.controller";
import { ServerRoute } from "@hapi/hapi";

@Provider()
export class HealthRouter implements IRouter {
    constructor(
        private readonly controller: HealthController,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        return [{
            method: 'GET',
            path: '/health',
            handler: this.controller.healthCheck.bind(this.controller),
            rules: {
                mapSilently: true,
            },
        }];
    }
}
