import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {configService} from "./config/config.service";
import {ValidationPipe} from "@nestjs/common";
import * as morgan from 'morgan';

const PORT = configService.getNumber('SERVER_PORT');
const LOGGING_LEVEL = configService.get('SERVER_LOGGING-LEVEL');

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(morgan(LOGGING_LEVEL, { skip: req => req.url === '/health' }));
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors();
    app.enableShutdownHooks();

    await app.listen(PORT);
}

bootstrap();
