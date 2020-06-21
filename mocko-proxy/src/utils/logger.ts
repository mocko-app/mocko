import * as Winston from 'winston';

export interface ILogger {

    info(message: string): void;

    warn(message: string): void;

    error(message: string): void;

    verbose(message: string): void;

    debug(message: string): void;
}

export const Logger = Symbol('Logger');

const consoleTransport = new Winston.transports.Console({
    format: Winston.format.combine(
        Winston.format.timestamp(),
        Winston.format.padLevels(),
        Winston.format.printf(({ timestamp, level, message }) =>
            `[${timestamp} ${level}] ${message}`)
    ),
});

export const logger = Winston.createLogger({
    transports: [consoleTransport]
});
