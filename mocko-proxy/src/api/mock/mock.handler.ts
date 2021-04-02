import * as Hoek from '@hapi/hoek';
import * as Handlebars from 'handlebars';
import { Request, ResponseObject, ResponseToolkit } from "@hapi/hapi";
import { MockRepository } from './mock.repository';
import { ProxyController } from '../proxy/proxy.controller';
import { MockFailure } from './data/mock-failure';
import { ILogger } from '@mocko/logger';
import { resync } from '@mocko/resync';
import { isStream } from '../../utils/stream';
import { MockResponse } from '../../definitions/data/mock';

const debug = require('debug')('mocko:proxy:mock:handler');

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
        proxyTo: null | string,
        proxyLabel: null | string,
    },

    data: Record<string, any>,
    var: Record<string, any>,
}

export class MockHandler {
    private readonly bodyTemplate: (context: any, options?: RuntimeOptions) => Promise<string>;

    constructor(
        private readonly repository: MockRepository,
        private readonly proxyController: ProxyController,
        private readonly logger: ILogger,

        private readonly mockResponse: MockResponse,
        private readonly customData: Record<string, any> = {},
        private readonly mockId?: string,
    ) {
        this.bodyTemplate = resync(Handlebars.compile(this.mockResponse.body));
    }

    public handle = async (request: Request, h: ResponseToolkit): Promise<ResponseObject> => {
        // Setting logger label
        request['_label'] = 'mock';

        const context = this.buildContext(request);
        debug('building body from handlebars template');
        const resBody = await this.buildBody(context);

        if(this.mockResponse.delay) {
            debug(`waiting ${this.mockResponse.delay} ms`)
            await Hoek.wait(this.mockResponse.delay);
        }

        if(context.response.proxyTo !== null) {
            debug(`proxying`)
            return await this.proxyController.proxyRequest(request, h, context.response.proxyTo, context.response.proxyLabel);
        }

        debug('creating hapi response')
        const res = h
            .response(resBody)
            .code(context.response.status);

        Object.entries({ ...this.mockResponse.headers, ...context.response.headers })
            .forEach(([key, value]) => res.header(key, value));

        debug('done')
        return res;
    }

    private buildContext(request: Request): Context {
        const { params, headers, query, payload } = request;
        const { code: status } = this.mockResponse;

        return {
            request: { params, headers, query, body: isStream(payload) ? null : payload },
            response: { status, headers: {}, proxyTo: null, proxyLabel: null },
            data: this.customData,
            var: {},
        };
    }

    private async buildBody(context: any): Promise<string> {
        try {
            return await this.bodyTemplate(context);
        } catch(e) {
            debug('failed to build body from template, registering failure');
            await this.registerFailure(e);
            this.logger.error(e);
            debug('done')
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
