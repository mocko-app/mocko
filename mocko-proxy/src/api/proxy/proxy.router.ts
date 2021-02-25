import {IRouter} from "../../utils/router";
import {Provider} from "../../utils/decorators/provider";
import {ProxyController} from "./proxy.controller";

@Provider()
export class ProxyRouter implements IRouter {
    constructor(
        private readonly controller: ProxyController,
    ) { }

    async getRoutes() {
        return [{
            method: '*',
            path: '/{any*}',
            handler: this.controller.proxyRequest.bind(this.controller),
            config: {
                payload: {
                    output: 'stream',
                    parse: false,
                },
            },
            rules: {
                mapSilently: true,
            },
        }];
    }
}
