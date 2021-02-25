import {Service} from "../../utils/decorators/service";
import {ServerRoute} from "@hapi/hapi";
import {MockRepository} from "./mock.repository";
import * as Handlebars from 'handlebars';
import * as helpers from '@mocko/helpers';
import {ProxyController} from "../proxy/proxy.controller";
import { FlagService } from "../flag/flag.service";
import { ILogger, Logger } from "../../utils/logger";
import { inject } from "inversify";
import { MockHandler } from "./mock.handler";

@Service()
export class MockService {
    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly repository: MockRepository,
        private readonly proxyController: ProxyController,
        private readonly flagService: FlagService,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        const options = await this.repository.getMockOptions();
        this.registerHandlebarsHelpers();

        return options.mocks.map(({ id, method, path, host, response, parse }) => ({
            method, path, vhost: host, handler:
                new MockHandler(this.repository, this.proxyController, this.logger, response, options.data, id).handle,
            config: parse === false ? {
                payload: {
                    output: 'stream',
                    parse: false,
                },
            } : {},
        }));
    }

    private registerHandlebarsHelpers() {
        helpers([
            'array', 'collection', 'comparison', 'date', 'html',
            'i18n', 'inflection', 'markdown', 'match', 'math', 'misc',
            'number', 'object', 'path', 'regex', 'string', 'url'
        ],{
            handlebars: Handlebars,
        });

        Handlebars.registerHelper('log', (...params) => {
            this.logger.info(params.slice(0, -1).join(' '));
        });

        Handlebars.registerHelper('warn', (...params) => {
            this.logger.warn(params.slice(0, -1).join(' '));
        });

        Handlebars.registerHelper('error', (...params) => {
            this.logger.error(params.slice(0, -1).join(' '));
        });

        Handlebars.registerHelper('setStatus', function(status) {
            this.response.status = status;
        });

        Handlebars.registerHelper('proxy', function(proxyUri) {
            this.response.proxyTo = typeof proxyUri === 'string' ? proxyUri : '';
        });

        Handlebars.registerHelper('setHeader', function(key, value) {
            this.response.headers[key] = value;
        });

        Handlebars.registerHelper('getFlag', (flag: any) => {
            if(typeof flag !== "string") {
                throw new TypeError("Flag must be a string");
            }

            return this.flagService.getFlag(flag);
        });

        Handlebars.registerHelper('setFlag', (flag: any, value: any) => {
            if(typeof flag !== "string") {
                throw new TypeError("Flag must be a string");
            }

            this.flagService.setFlag(flag, value);
        });

        Handlebars.registerHelper('delFlag', (flag: any) => {
            if(typeof flag !== "string") {
                throw new TypeError("Flag must be a string");
            }

            this.flagService.delFlag(flag);
        });

        const self = this;
        Handlebars.registerHelper('hasFlag', function (flag: any, options) {
            if(typeof flag !== "string") {
                throw new TypeError("Flag must be a string");
            }

            const hasFlag = self.flagService.hasFlag(flag);
            if(hasFlag) {
                return options.fn(this);
            } else if(typeof options.inverse === 'function') {
                return options.inverse(this);
            }
        });
    }
}
