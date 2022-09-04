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
import { DefinitionProvider } from "./definitions/definition.provider";

const debug = require('debug')('mocko:proxy:server');

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
        private readonly definitionProvider: DefinitionProvider,
    ) { }

    async start(): Promise<Server> {
        debug('registering listeners');
        const listenerRegistrationTasks = this.listenerProvider.listeners
            .map(l => this.redisProvider.registerListener(l, this));
        await Promise.all(listenerRegistrationTasks);
        return await this.startServer();
    }

    async stop(exitProcess = true) {
        debug('stopping the server');
        await this.app.stop();
        this.logger.info('Bye :)');

        if(exitProcess) {
            process.exit(0);
        }
    }

    async remapRoutes(): Promise<Server> {
        this.logger.info('Remapping routes');
        debug('building routes');
        this.definitionProvider.clearDefinitions();
        const routes = await this.router.getRoutes();

        debug('clearing routes');
        this.app['_core'].router.routes.clear();
        const vhosts = this.app['_core'].router.vhosts;
        if(vhosts) {
            vhosts.clear();
        }

        debug('mapping routes');
        routes.forEach(route => this.registerRoute(route));
        if(global.gc) {
            debug('forcing garbage collection');
            global.gc();
        } else {
            debug('skipping garbage collection, use --expose-gc');
        }

        debug('finished remaping routes');
        return this;
    }

    private async startServer(): Promise<Server> {
        debug('creating the server');
        this.startDate = new Date();
        this.app = new Hapi.Server({
            host: this.config.get('SERVER_HOST'),
            port: this.config.getNumber('SERVER_PORT'),
            routes: {
                cors: this.config.getBoolean('SERVER_ALLOW-CORS') ? {
                    origin: ['*'],
                } : false,
            },
            debug: {
                request: false,
            },
        });

        this.logger.info('Mapping routes');
        debug('mapping routes');
        const routes = await this.router.getRoutes();
        routes.forEach(route => this.registerRoute(route));

        const pluginRegistrationTasks = this.pluginProvider.plugins
            .map(plugin => this.app.register(plugin));
        await Promise.all(pluginRegistrationTasks);

        debug('starting the server');
        await this.app.start();

        const deltaT = (new Date().getTime() - this.startDate.getTime()) / 1000;
        this.logger.info(`Serving mocks on port ${this.config.getNumber('SERVER_PORT')} after ${deltaT} seconds`);
        debug('server started');
        return this;
    }

    private registerRoute(route: ServerRoute) {
        try {
            const logMessage = `Mapping '${route.vhost ? `(${route.vhost}) `:''}${route.method} ${route.path}'`;

            if(route.rules?.['mapSilently']) {
                debug(logMessage);
            } else {
                this.logger.info(logMessage);
            }

            this.app.route(route);
            this.validateRoutePath(route.path);
        } catch (e) {
            this.logger.warn(`Failed to map '${route.method} ${route.path}': ${e.message}`);
        }
    }

    private validateRoutePath(path: string): void {
        const docsRef = "On Mocko generic parameters are defined with '{param}'. Have a look at our docs:\nhttps://docs.mocko.dev/getting-started/standalone/#method-and-path";

        if(path.match(/\/\*($|\/)/)) {
            this.logger.warn(`The path '${path}' contains a '*'. ${docsRef}`);
        }
        if(path.match(/\/:./)) {
            this.logger.warn(`The path '${path}' contains a parameter defined with ':param'. ${docsRef}`);
        }
        if(path.match(/\/\$\{\w*\}/)) {
            this.logger.warn(`The path '${path}' contains a parameter defined with '\${param}'. ${docsRef}`);
        }
    }
}
