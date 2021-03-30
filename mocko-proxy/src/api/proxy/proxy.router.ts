import {IRouter} from "../../utils/router";
import {Provider} from "../../utils/decorators/provider";
import {ProxyController} from "./proxy.controller";
import { ProxyService } from "./proxy.service";
import { Host } from "../../definitions/data/host";

@Provider()
export class ProxyRouter implements IRouter {
    constructor(
        private readonly controller: ProxyController,
        private readonly service: ProxyService,
    ) { }

    async getRoutes() {
        const hosts = await this.service.getHosts();

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
        }, ...hosts.map(h => this.hostToRoute(h))];
    }

    hostToRoute(host: Host) {
        return {
            method: '*',
            path: '/{any*}',
            vhost: host.source,
            handler: (req, h) => this.controller.proxyRequest(req, h, host.destination),
            config: {
                payload: {
                    output: 'stream',
                    parse: false,
                },
            },
            rules: {
                mapSilently: true,
            },
        };
    }
}
