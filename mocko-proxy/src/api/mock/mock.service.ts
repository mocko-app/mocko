import {Service} from "../../utils/decorators/service";
import {MockResponse} from "./data/mock-options";
import {Lifecycle, Request, ResponseObject, ResponseToolkit, ServerRoute} from "@hapi/hapi";
import {MockRepository} from "./mock.repository";
import * as Handlebars from 'handlebars';
import * as helpers from 'handlebars-helpers';

@Service()
export class MockService {
    constructor(
        private readonly repository: MockRepository,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        const options = await this.repository.getMockOptions();
        this.registerHandlebarsHelpers();

        return options.mocks.map(({ method, path, response }) => ({
            method, path, handler: this.buildHandler(response)
        }));
    }

    private buildHandler(response: MockResponse): Lifecycle.Method {
        const bodyTemplate = Handlebars.compile(response.body);
        const statusTemplate = typeof response.code === 'string' && Handlebars.compile(response.code);

        return (request: Request, h: ResponseToolkit): ResponseObject => {
            const { params, headers, query, payload: body } = request;
            const context = {
                request: { params, headers, query, body }
            };

            let status = response.code;
            if(typeof status === 'string') {
                status = Number(statusTemplate(context));
            }

            const res = h
                .response(bodyTemplate(context))
                .code(status);

            Object.entries(response.headers).forEach(([key, value]) =>
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
    }
}
