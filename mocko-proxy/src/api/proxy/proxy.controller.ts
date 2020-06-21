import {Provider} from "../../utils/decorators/provider";
import * as Hapi from '@hapi/hapi';
import {ProxyService} from "./proxy.service";

@Provider()
export class ProxyController {
    constructor(
        private readonly service: ProxyService,
    ) { }

    proxyRequest(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const uri = this.service.getProxyUri();
        return h.proxy({ uri });
    }
}
