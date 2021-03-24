import { affect } from "@mocko/resync";
import { ILogger } from "src/utils/logger";

export const log = (logger: ILogger) => (...params: any[]): void => {
    affect(() => logger.info(params.slice(0, -1).join(' ')));
};
export const warn = (logger: ILogger) => (...params: any[]): void => {
    affect(() => logger.warn(params.slice(0, -1).join(' ')));

};
export const error = (logger: ILogger) => (...params: any[]): void => {
    affect(() => logger.error(params.slice(0, -1).join(' ')));
};
