import { ServerRoute } from "@hapi/hapi";
import { configProvider } from "../../config/config.service";
import { Provider } from "../../utils/decorators/provider";
import { IRouter } from "../../utils/router";
import { DeployController } from "./deploy.controller";

const DEPLOY_ENDPOINT_ENABLED = configProvider.getOptionalBoolean('DEPLOY_ENDPOINT_ENABLED');

@Provider()
export class DeployRouter implements IRouter {
    constructor(
        private readonly controller: DeployController,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        if(!DEPLOY_ENDPOINT_ENABLED) {
            return [];
        }

        return [{
            method: 'POST',
            path: '/__mocko__/deploy',
            handler: this.controller.deploy.bind(this.controller),
            rules: {
                mapSilently: true,
            },
        }];
    }
}
