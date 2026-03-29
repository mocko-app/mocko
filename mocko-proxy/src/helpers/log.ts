import { ILogger } from "src/utils/logger";

const stringifyParam = (param: any): string => {
    if (param !== null && typeof param === 'object') {
        try {
            return JSON.stringify(param, null, 2);
        } catch (_) {
            return String(param);
        }
    }

    return String(param);
};

const formatParams = (...params: any[]): string => params
    .map(param => stringifyParam(param))
    .join(' ');

export const log = (logger: ILogger) => (...params: any[]): void => {
    logger.info(formatParams(...params));
};
export const warn = (logger: ILogger) => (...params: any[]): void => {
    logger.warn(formatParams(...params));
};
export const error = (logger: ILogger) => (...params: any[]): void => {
    logger.error(formatParams(...params));
};
