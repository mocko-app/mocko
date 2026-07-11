import { inject } from "inversify";
import * as Hapi from '@hapi/hapi';
import { ServerRoute } from "@hapi/hapi";
import { Provider } from "./utils/decorators/provider";
import { ILogger, Logger } from "./utils/logger";
import { DiagnosticsCollector } from "./definitions/diagnostics";

const debug = require('debug')('mocko:proxy:server');

@Provider()
export class RouteRegistrar {
    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly diagnostics: DiagnosticsCollector,
    ) { }

    register(server: Hapi.Server, route: ServerRoute): void {
        try {
            const logMessage = `Mapping '${route.vhost ? `(${route.vhost}) `:''}${route.method} ${route.path}'`;

            if(route.rules?.['mapSilently']) {
                debug(logMessage);
            } else {
                this.logger.info(logMessage);
            }

            server.route(route);
            this.validateRoutePath(route);
        } catch (e) {
            this.logger.warn(`Failed to map '${route.method} ${route.path}': ${e.message}`);
            const isQueryInPath = route.path.includes('?');
            this.diagnostics.push({
                code: isQueryInPath ? 'query-in-path' : 'route-mapping-failed',
                severity: 'error',
                mock: `${route.method} ${route.path}`,
                message: isQueryInPath
                    ? "query parameters can't be part of the path"
                    : `failed to map the route: ${e.message}`,
            });
        }
    }

    private validateRoutePath(route: ServerRoute): void {
        const path = route.path;
        const docsRef = "On Mocko generic parameters are defined with '{param}'. Have a look at our docs:\nhttps://docs.mocko.dev/getting-started/standalone/#method-and-path";

        if(path.match(/\/\*($|\/)/)) {
            this.logger.warn(`The path '${path}' contains a '*'. ${docsRef}`);
            this.pushSuspiciousPath(route, "the path contains a '*' wildcard");
        }
        if(path.match(/\/:./)) {
            this.logger.warn(`The path '${path}' contains a parameter defined with ':param'. ${docsRef}`);
            this.pushSuspiciousPath(route, "the path contains an Express-style ':param' parameter");
        }
        if(path.match(/\/\$\{\w*\}/)) {
            this.logger.warn(`The path '${path}' contains a parameter defined with '\${param}'. ${docsRef}`);
            this.pushSuspiciousPath(route, "the path contains a parameter defined with '${param}'");
        }
    }

    private pushSuspiciousPath(route: ServerRoute, message: string): void {
        this.diagnostics.push({
            code: 'suspicious-path',
            severity: 'warning',
            mock: `${route.method} ${route.path}`,
            message,
        });
    }
}
