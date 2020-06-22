import { Provider } from "./utils/decorators/provider";
import { ILogger, Logger } from './utils/logger';
import { inject } from "inversify";
import {ConfigProvider} from "./config/config.service";
import * as Hapi from '@hapi/hapi';
import {MainRouter} from "./main.router";
import {PluginProvider} from "./plugins";
import {ServerRoute} from "@hapi/hapi";

@Provider()
export class Server {
    private app: Hapi.Server;

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly config: ConfigProvider,
        private readonly router: MainRouter,
        private readonly pluginProvider: PluginProvider,
    ) { }

    async start(): Promise<Server> {
        this.logger.info('Creating the server');
        this.app = new Hapi.Server({
            host: this.config.get('SERVER_HOST'),
            port: this.config.getNumber('SERVER_PORT'),
            routes: {
                cors: this.config.getBoolean('SERVER_ALLOW-CORS'),
            }
        });

        this.logger.info('Mapping routes');
        const routes = await this.router.getRoutes();
        routes.forEach(route => this.registerRoute(route));

        this.logger.info('Registering plugins');
        const pluginRegistrationTasks = this.pluginProvider.plugins.map(plugin => this.app.register(plugin));
        await Promise.all(pluginRegistrationTasks);

        this.logger.info('Starting the server');
        await this.app.start();

        this.logger.info('Server is running on ' + this.app.info.uri);
        return this;
    }

    async stop() {
        this.logger.info('Stopping the server');
        await this.app.stop();
        this.logger.info('Bye :)');
        process.exit(0);
    }

    private registerRoute(route: ServerRoute) {
        try {
            this.logger.info(`Mapping '${route.method} ${route.path}'`);
            this.app.route(route);
        } catch (e) {
            this.logger.warn(`Failed to map '${route.method} ${route.path}': ${e.message}`);
        }
    }
}
