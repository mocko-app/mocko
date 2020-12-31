import 'reflect-metadata';
import { Container } from 'inversify';
import { Server } from './server';
import { ILogger, Logger, logger } from './utils/logger';
import {configProvider, ConfigProvider} from "./config/config.service";

const debug = require('debug')('main');

async function bootstrap() {
    debug('starting');
    const container = new Container({
        autoBindInjectable: true,
    });

    container.bind<ILogger>(Logger).toConstantValue(logger);
    container.bind<ConfigProvider>(ConfigProvider).toConstantValue(configProvider);

    debug('resolving dependencies')
    const server = await container
        .resolve<Server>(Server)
        .start();

    process.on('SIGINT',  () => server.stop());
    process.on('SIGTERM', () => server.stop());

    return server;
}

module.exports.server = bootstrap();
