import {IRouter} from "./utils/router";
import {Provider} from "./utils/decorators/provider";
import {ProxyRouter} from "./api/proxy/proxy.router";
import {MockRouter} from "./api/mock/mock.router";

@Provider()
export class MainRouter implements IRouter {
    constructor(
        private readonly proxyRouter: ProxyRouter,
        private readonly mockRouter: MockRouter,
    ) { }

    async getRoutes() {
        const routes = await Promise.all([
            this.proxyRouter.getRoutes(),
            this.mockRouter.getRoutes(),
        ]);

        return routes.flat();
    }
}
