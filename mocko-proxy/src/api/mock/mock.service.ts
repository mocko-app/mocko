import { Service } from "../../utils/decorators/service";
import { ServerRoute } from "@hapi/hapi";
import { MockRepository } from "./mock.repository";
import { ProxyController } from "../proxy/proxy.controller";
import { FlagService } from "../flag/flag.service";
import { ILogger, Logger } from "../../utils/logger";
import { inject } from "inversify";
import { MockHandler } from "./mock.handler";
import * as LogHelpers from "../../helpers/log";
import * as ResponseHelpers from "../../helpers/response";
import * as FlagHelpers from "../../helpers/flag";
import * as VarHelpers from "../../helpers/var";
import { DefinitionProvider } from "../../definitions/definition.provider";
import Bigodon from "bigodon";
import { Mock } from "../../definitions/data/mock";

@Service()
export class MockService {
    private readonly bigodon = new Bigodon();

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly repository: MockRepository,
        private readonly proxyController: ProxyController,
        private readonly flagService: FlagService,
        private readonly definitionProvider: DefinitionProvider,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        const options = await this.definitionProvider.getDefinitions();
        this.registerHelpers();

        return options.mocks.map(mock => this.mockToRoute(mock, options.data));
    }

    private mockToRoute(mock: Mock, data: Record<string, any>): ServerRoute {
        let config = {};
        const handler = new MockHandler(
            this.bigodon,
            this.repository,
            this.proxyController,
            this.logger,
            mock.response,
            data,
            mock.id
        ).handle;

        if (mock.parse === false) {
            config = {
                payload: {
                    output: 'stream',
                    parse: false,
                },
            };
        }

        return {
            method: mock.method,
            path: mock.path,
            vhost: mock.host,
            handler,
            // @ts-expect-error Extra config for @mocko/h2o2, not on official hapi types
            config,
        };
    }

    private registerHelpers() {
        this.bigodon.addHelper('log', LogHelpers.log(this.logger));
        this.bigodon.addHelper('warn', LogHelpers.warn(this.logger));
        this.bigodon.addHelper('error', LogHelpers.error(this.logger));

        this.bigodon.addHelper('setStatus', ResponseHelpers.setStatus);
        this.bigodon.addHelper('proxy', ResponseHelpers.proxy(this.definitionProvider));
        this.bigodon.addHelper('setHeader', ResponseHelpers.setHeader);

        this.bigodon.addHelper('getFlag', FlagHelpers.getFlag(this.flagService));
        this.bigodon.addHelper('setFlag', FlagHelpers.setFlag(this.flagService));
        this.bigodon.addHelper('delFlag', FlagHelpers.delFlag(this.flagService));
        this.bigodon.addHelper('hasFlag', FlagHelpers.hasFlag(this.flagService));

        this.bigodon.addHelper('get', VarHelpers.getVar);
        this.bigodon.addHelper('set', VarHelpers.setVar);
    }
}
