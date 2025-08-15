import { ILogger } from "src/utils/logger";

export const log = (logger: ILogger) => (...params: any[]): void => {
    logger.info(params.join(' '));
};
export const warn = (logger: ILogger) => (...params: any[]): void => {
    logger.warn(params.join(' '));
};
export const error = (logger: ILogger) => (...params: any[]): void => {
    logger.error(params.join(' '));
};
