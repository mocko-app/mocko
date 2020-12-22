import {Service} from "../../utils/decorators/service";
import {MockResponse} from "./data/mock-options";
import {Lifecycle, Request, ResponseObject, ResponseToolkit, ServerRoute} from "@hapi/hapi";
import {MockRepository} from "./mock.repository";
import * as Handlebars from 'handlebars';
import * as helpers from 'handlebars-helpers';
import {sleep} from "../../utils/utils";
import {ProxyController} from "../proxy/proxy.controller";
import { MockFailure } from "./data/mock-failure";
import { FlagService } from "../flag/flag.service";

@Service()
export class MockService {
    constructor(
        private readonly repository: MockRepository,
        private readonly proxyController: ProxyController,
        private readonly flagService: FlagService,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        const options = await this.repository.getMockOptions();
        this.registerHandlebarsHelpers();

        return options.mocks.map(({ id, method, path, response }) => ({
            method, path, handler: this.buildHandler(response, options.data, id)
        }));
    }

    private buildHandler(response: MockResponse, data: Record<string, any> = {}, id?: string): Lifecycle.Method {
        const bodyTemplate = Handlebars.compile(response.body);

        return async (request: Request, h: ResponseToolkit): Promise<ResponseObject> => {
            const { params, headers, query, payload: body } = request;
            const { code: status } = response;

            const context = {
                request: { params, headers, query, body },
		        response: { status, headers: {} as Record<string, string>, mustProxy: false },
                data
            };

            if(response.delay) {
                await sleep(response.delay);
            }

            let resBody: string;
            try {
                 resBody = bodyTemplate(context);
            } catch(e) {
                if(id) {
                    await this.registerFailure(id, e);
                }
                throw e;
            }

            if(context.response.mustProxy) {
                return await this.proxyController.proxyRequest(request, h);
            }

            const res = h
                .response(resBody)
                .code(context.response.status);

            Object.entries({ ...response.headers, ...context.response.headers }).forEach(([key, value]) =>
                res.header(key, value));

            return res;
        };
    }

    private registerHandlebarsHelpers() {
        helpers([
            'array', 'collection', 'comparison', 'date', 'html', 'i18n',
            'inflection', 'logging', 'markdown', 'match', 'math', 'misc',
            'number', 'object', 'path', 'regex', 'string', 'url'
        ],{
            handlebars: Handlebars,
        });

        Handlebars.registerHelper('setStatus', function(status) {
            this.response.status = status;
        });

        Handlebars.registerHelper('proxy', function() {
            this.response.mustProxy = true;
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

    private async registerFailure(id: string, error: Error): Promise<void> {
        const failure = new MockFailure(error.toString(), new Date());
        await this.repository.saveFailure(id, failure);
    }
}
