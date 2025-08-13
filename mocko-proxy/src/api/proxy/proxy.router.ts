import {IRouter} from "../../utils/router";
import {Provider} from "../../utils/decorators/provider";
import {ProxyController} from "./proxy.controller";
import { ProxyService } from "./proxy.service";
import { Host } from "../../definitions/data/host";
import { ServerRoute } from "@hapi/hapi";

@Provider()
export class ProxyRouter implements IRouter {
    constructor(
        private readonly controller: ProxyController,
        private readonly service: ProxyService,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        const hosts = await this.service.getHosts();

        return [{
            method: '*',
            path: '/{any*}',
            handler: this.controller.proxyRequest.bind(this.controller),
            // @ts-expect-error Extra config for @mocko/h2o2, not on official hapi types
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

    hostToRoute(host: Host): ServerRoute {
        return {
            method: '*',
            path: '/{any*}',
            vhost: host.source,
            handler: (req, h) => this.controller.proxyRequest(req, h, host.destination, `@${host.name}`),
            // @ts-expect-error Extra config for @mocko/h2o2, not on official hapi types
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
