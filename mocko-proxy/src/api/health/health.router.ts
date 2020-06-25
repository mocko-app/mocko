import {IRouter} from "../../utils/router";
import {Provider} from "../../utils/decorators/provider";
import {HealthController} from "./health.controller";

@Provider()
export class HealthRouter implements IRouter {
    constructor(
        private readonly controller: HealthController,
    ) { }

    async getRoutes() {
        return [{
            method: 'GET',
            path: '/health',
            handler: this.controller.healthCheck.bind(this.controller),
        }];
    }
}
