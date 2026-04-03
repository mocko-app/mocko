import {IRouter} from "./utils/router";
import {Provider} from "./utils/decorators/provider";
import {ProxyRouter} from "./api/proxy/proxy.router";
import {MockRouter} from "./api/mock/mock.router";
import {HealthRouter} from "./api/health/health.router";
import {DeployRouter} from "./api/deploy/deploy.router";

@Provider()
export class MainRouter implements IRouter {
    constructor(
        private readonly proxyRouter: ProxyRouter,
        private readonly mockRouter: MockRouter,
        private readonly healthRouter: HealthRouter,
        private readonly deployRouter: DeployRouter,
    ) { }

    async getRoutes() {
        const routes = await Promise.all([
            this.deployRouter.getRoutes(),
            this.healthRouter.getRoutes(),
            this.mockRouter.getRoutes(),
            this.proxyRouter.getRoutes(),
        ]);

        return routes.flat();
    }
}
