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
        return [
            {
                method: 'GET',
                path: '/__mocko__/callbacks',
                handler: this.controller.listCallbacks.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'GET',
                path: '/__mocko__/callbacks/pending',
                handler: this.controller.listPending.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'POST',
                path: '/__mocko__/callbacks/{slug}/fire',
                handler: this.controller.fire.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'POST',
                path: '/__mocko__/callbacks/pending/{id}/fire',
                handler: this.controller.firePending.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'DELETE',
                path: '/__mocko__/callbacks/pending/{id}',
                handler: this.controller.cancelPending.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'DELETE',
                path: '/__mocko__/callbacks/pending',
                handler: this.controller.clearPending.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
        ];
    }
}
