import { Provider } from "./utils/decorators/provider";
import { ILogger, Logger } from './utils/logger';
import { inject } from "inversify";
import {ConfigProvider} from "./config/config.service";
import * as Hapi from '@hapi/hapi';
import {MainRouter} from "./main.router";
import {PluginProvider} from "./plugins";
import {ServerRoute} from "@hapi/hapi";
import {ListenerProvider} from "./listeners";
import {RedisProvider} from "./redis/redis.provider";

@Provider()
export class Server {
    private app: Hapi.Server;
    private startDate: Date;

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly config: ConfigProvider,
        private readonly router: MainRouter,
        private readonly pluginProvider: PluginProvider,
        private readonly listenerProvider: ListenerProvider,
        private readonly redisProvider: RedisProvider,
    ) { }

    async start(): Promise<Server> {
        const listenerRegistrationTasks = this.listenerProvider.listeners
            .map(l => this.redisProvider.registerListener(l, this));
        await Promise.all(listenerRegistrationTasks);
        return await this.startServer();
    }

    async stop() {
        this.logger.info('Stopping the server');
        await this.app.stop();
        this.logger.info('Bye :)');
        process.exit(0);
    }

    async restart(): Promise<Server> {
        this.logger.info('Restarting the server');
        await this.app.stop();
        return await this.startServer();
    }

    private async startServer(): Promise<Server> {
        this.startDate = new Date();
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

        const pluginRegistrationTasks = this.pluginProvider.plugins
            .map(plugin => this.app.register(plugin));
        await Promise.all(pluginRegistrationTasks);

        this.logger.info('Starting the server');
        await this.app.start();

        const deltaT = (new Date().getTime() - this.startDate.getTime()) / 1000;
        this.logger.info(`Serving mocks on port ${this.config.getNumber('SERVER_PORT')} after ${deltaT} seconds`);
        return this;
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
