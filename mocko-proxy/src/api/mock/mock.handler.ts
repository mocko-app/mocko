import * as Hoek from '@hapi/hoek';
import { Request, ResponseObject, ResponseToolkit } from "@hapi/hapi";
import { MockRepository } from './mock.repository';
import { ProxyController } from '../proxy/proxy.controller';
import { MockFailure } from './data/mock-failure';
import { ILogger } from '@mocko/logger';
import { isStream } from '../../utils/stream';
import { MockResponse } from '../../definitions/data/mock';
import Bigodon, { TemplateRunner } from 'bigodon';
import { Execution } from 'bigodon/dist/runner/execution';

const debug = require('debug')('mocko:proxy:mock:handler');

export type BigodonContext = {
    request: {
        params: Record<string, string>,
        headers: Record<string, string>,
        query: Record<string, string>,
        body: unknown,
    },
    data: Record<string, any>,
};

export type BigodonData = {
    status: number,
    responseHeaders: Record<string, string>,
    vars: Record<string, any>,
    proxyTo?: string,
    proxyLabel?: string | null,
};

export type MockoExecution = Execution & {
    data: BigodonData,
    contexts: [BigodonContext, ...unknown[]],
};

export class MockHandler {
    private readonly bodyTemplate: TemplateRunner;

    constructor(
        private readonly bigodon: Bigodon,
        private readonly repository: MockRepository,
        private readonly proxyController: ProxyController,
        private readonly logger: ILogger,

        private readonly mockResponse: MockResponse,
        private readonly customData: Record<string, any> = {},
        private readonly mockId?: string,
    ) {
        this.bodyTemplate = this.bigodon.compile(this.mockResponse.body);
    }

    public handle = async (request: Request, h: ResponseToolkit): Promise<ResponseObject> => {
        // Setting logger label
        request['_label'] = 'mock';

        debug('creating context');
        const context = this.buildContext(request);
        const data = this.buildData();
        debug('building body from bigodon template');
        const resBody = await this.buildBody(context, data);

        if(this.mockResponse.delay) {
            debug(`waiting ${this.mockResponse.delay} ms`)
            await Hoek.wait(this.mockResponse.delay);
        }

        if(data.proxyTo) {
            debug(`proxying due to helper request to '${data.proxyTo}'`);
            return await this.proxyController.proxyRequest(request, h, data.proxyTo, data.proxyLabel);
        }

        debug('creating hapi response')
        const res = h
            .response(resBody)
            .code(data.status);

        Object.entries(data.responseHeaders)
            .forEach(([key, value]) => res.header(key, value));

        debug('done')
        return res;
    }

    private buildData(): BigodonData {
        return {
            status: this.mockResponse.code,
            responseHeaders: { ...this.mockResponse.headers },
            vars: {},
        };
    }

    private buildContext(request: Request): BigodonContext {
        const { params, headers, query, payload } = request;

        return {
            request: { params, headers, query, body: isStream(payload) ? null : payload },
            data: this.customData,
        };
    }

    private async buildBody(context: BigodonContext, data: BigodonData): Promise<string> {
        try {
            return await this.bodyTemplate(context, { data });
        } catch(e) {
            debug('failed to build body from template, registering failure');
            await this.registerFailure(e);
            this.logger.error(e);
            debug('done');
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
