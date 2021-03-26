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
import * as LogHelpers from "../../helpers/log";
import * as ResponseHelpers from "../../helpers/response";
import * as FlagHelpers from "../../helpers/flag";
import * as VarHelpers from "../../helpers/var";
import * as UtilHelpers from "../../helpers/util";

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

        Handlebars.registerHelper('log', LogHelpers.log(this.logger));
        Handlebars.registerHelper('warn', LogHelpers.warn(this.logger));
        Handlebars.registerHelper('error', LogHelpers.error(this.logger));

        Handlebars.registerHelper('setStatus', ResponseHelpers.setStatus);
        Handlebars.registerHelper('proxy', ResponseHelpers.proxy);
        Handlebars.registerHelper('setHeader', ResponseHelpers.setHeader);

        Handlebars.registerHelper('getFlag', FlagHelpers.getFlag(this.flagService));
        Handlebars.registerHelper('setFlag', FlagHelpers.setFlag(this.flagService));
        Handlebars.registerHelper('delFlag', FlagHelpers.delFlag(this.flagService));
        Handlebars.registerHelper('hasFlag', FlagHelpers.hasFlag(this.flagService));

        Handlebars.registerHelper('get', VarHelpers.getVar);
        Handlebars.registerHelper('set', VarHelpers.setVar);

        Handlebars.registerHelper('uuid', UtilHelpers.uuid);
        Handlebars.registerHelper('substring', UtilHelpers.substring);
    }
}
