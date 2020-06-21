import {IRouter} from "./utils/router";
import {Provider} from "./utils/decorators/provider";
import {ProxyRouter} from "./api/proxy/proxy.router";

@Provider()
export class MainRouter implements IRouter {
    constructor(
        private readonly proxyRouter: ProxyRouter,
    ) { }

    readonly routes = [...this.proxyRouter.routes];
}
