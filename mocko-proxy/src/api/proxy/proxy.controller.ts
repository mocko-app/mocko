import {Provider} from "../../utils/decorators/provider";
import * as Hapi from '@hapi/hapi';
import {ProxyService} from "./proxy.service";
import * as Boom from "@hapi/boom";
import {configProvider} from "../../config/config.service";

const TIMEOUT = configProvider.getNumber('PROXY_TIMEOUT-MILLIS');

@Provider()
export class ProxyController {
    constructor(
        private readonly service: ProxyService,
    ) { }

    proxyRequest(request: Hapi.Request, h: Hapi.ResponseToolkit, overrideUri?: string) {
        const mustProxy = this.service.isProxyEnabled() || !!overrideUri;
        const uri = this.service.getProxyUri(overrideUri);

        if(!mustProxy) {
            throw Boom.notFound('No mock was found for this endpoint and method. Proxying is also disabled.');
        }

        return h.proxy({
            uri,
            passThrough: true,
            xforward: true,
            timeout: TIMEOUT
        });
    }
}
