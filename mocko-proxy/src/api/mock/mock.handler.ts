import * as Hoek from '@hapi/hoek';
import * as Handlebars from 'handlebars';
import { Request, ResponseObject, ResponseToolkit } from "@hapi/hapi";
import { MockResponse } from "./data/mock-options";
import { MockRepository } from './mock.repository';
import { ProxyController } from '../proxy/proxy.controller';
import { MockFailure } from './data/mock-failure';
import { ILogger } from '@mocko/logger';

type Context = {
    request: {
        params: Record<string, string>,
        headers: Record<string, string>,
        query: Record<string, string>,
        body: any,
    },
    
    response: {
        status: number,
        headers: Record<string, string>,
        mustProxy: boolean,
    },

    data: Record<string, any>,
}

export class MockHandler {
    private readonly bodyTemplate: HandlebarsTemplateDelegate;

    constructor(
        private readonly repository: MockRepository,
        private readonly proxyController: ProxyController,
        private readonly logger: ILogger,

        private readonly mockResponse: MockResponse,
        private readonly customData: Record<string, any> = {},
        private readonly mockId?: string,
    ) {
        this.bodyTemplate = Handlebars.compile(this.mockResponse.body);
    }

    public handle = async (request: Request, h: ResponseToolkit): Promise<ResponseObject> => {
        const context = this.buildContext(request);
        const resBody = await this.buildBody(context);

        if(this.mockResponse.delay) {
            await Hoek.wait(this.mockResponse.delay);
        }

        if(context.response.mustProxy) {
            return await this.proxyController.proxyRequest(request, h);
        }

        const res = h
            .response(resBody)
            .code(context.response.status);

        Object.entries({ ...this.mockResponse.headers, ...context.response.headers })
            .forEach(([key, value]) => res.header(key, value));

        return res;
    }

    private buildContext(request: Request): Context {
        const { params, headers, query, payload: body } = request;
        const { code: status } = this.mockResponse;

        return {
            request: { params, headers, query, body },
            response: { status, headers: {}, mustProxy: false },
            data: this.customData,
        };
    }

    private async buildBody(context: any): Promise<string> {
        try {
            return this.bodyTemplate(context);
        } catch(e) {
            await this.registerFailure(e);
            this.logger.error(e);
            throw e;
        }
    }

    private async registerFailure(error: Error): Promise<void> {
        if(!this.mockId) {
            return;
        }

        const failure = new MockFailure(error.toString(), new Date());
        await this.repository.saveFailure(this.mockId, failure);
    }
}
