import { ServerRoute } from "@hapi/hapi";
import { Provider } from "../../utils/decorators/provider";
import { IRouter } from "../../utils/router";
import { CallbackController } from "./callback.controller";

@Provider()
export class CallbackRouter implements IRouter {
    constructor(
        private readonly controller: CallbackController,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        return [{
            method: 'GET',
            path: '/__mocko__/callbacks',
            handler: this.controller.listCallbacks.bind(this.controller),
            rules: {
                mapSilently: true,
            },
        }];
    }
}
