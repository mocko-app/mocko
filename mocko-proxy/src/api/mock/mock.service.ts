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
import { DefinitionProvider } from "../../definitions/definition.provider";
import Bigodon from "bigodon";
import { Mock } from "../../definitions/data/mock";
import { Host } from "../../definitions/data/host";
import { CoreMockDetailsDto, CoreMockDto } from "./data/core-mock.dto";

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

    async getMockRoutes(): Promise<ServerRoute[]> {
        const options = await this.definitionProvider.getDefinitions();
        this.registerHelpers();

        return options.mocks
            .filter((mock) => mock.isEnabled)
            .filter((mock) => !this.isReservedPath(mock.path))
            .map((mock) => this.mockToRoute(mock, options.data, options.hosts));
    }

    private mockToRoute(mock: Mock, data: Record<string, any>, hosts: Host[]): ServerRoute {
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
        const vhost = this.resolveMockHost(mock.host, hosts);

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
            vhost,
            handler,
            // @ts-expect-error Extra config for @mocko/h2o2, not on official hapi types
            config,
        };
    }

    async listMocks(): Promise<CoreMockDto[]> {
        const options = await this.definitionProvider.getDefinitions();
        return options.mocks.map((mock) => CoreMockDto.ofMock(mock));
    }

    private resolveMockHost(hostName: string | undefined, hosts: Host[]): string | undefined {
        if(!hostName) {
            return undefined;
        }

        const host = hosts.find((item) =>
            item.slug === hostName || item.source === hostName
        );
        return host?.source || hostName;
    }

    async getMockById(id: string): Promise<CoreMockDetailsDto | null> {
        const options = await this.definitionProvider.getDefinitions();
        const mock = options.mocks.find((item) => item.id === id);

        if(!mock) {
            return null;
        }

        const failure = await this.repository.getFailure(id);

        return CoreMockDetailsDto.of(mock, failure);
    }

    private isReservedPath(path: string): boolean {
        return path === '/__mocko__' || path.startsWith('/__mocko__/');
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
    }
}
