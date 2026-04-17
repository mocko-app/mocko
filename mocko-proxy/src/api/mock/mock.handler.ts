import * as Hoek from '@hapi/hoek';
import * as Boom from '@hapi/boom';
import { Request, ResponseObject, ResponseToolkit } from "@hapi/hapi";
import { MockRepository } from './mock.repository';
import { ProxyController } from '../proxy/proxy.controller';
import { MockFailure } from './data/mock-failure';
import { ILogger } from '@mocko/logger';
import { isStream } from '../../utils/stream';
import { Mock } from '../../definitions/data/mock';
import Bigodon, { TemplateRunner } from 'bigodon';
import { Execution } from 'bigodon/dist/runner/execution';

const debug = require('debug')('mocko:proxy:mock:handler');

export type BigodonContext = {
    request: {
        params: Record<string, string>,
        headers: Record<string, string | string[] | undefined>,
        query: Record<string, string | string[] | undefined>,
        body: unknown,
    },
    data: Record<string, any>,
};

export type BigodonData = {
    status: number,
    responseHeaders: Record<string, string>,
    proxyTo?: string,
    proxyLabel?: string | null,
};

export type MockoExecution = Execution & {
    data: BigodonData,
    contexts: [BigodonContext, ...unknown[]],
};

export class MockHandler {
    private readonly bodyTemplate: TemplateRunner | null;
    private readonly compilationError: string | null;

    constructor(
        private readonly bigodon: Bigodon,
        private readonly repository: MockRepository,
        private readonly proxyController: ProxyController,
        private readonly logger: ILogger,

        private readonly mock: Mock,
        private readonly customData: Record<string, any> = {},
    ) {
        try {
            this.bodyTemplate = this.bigodon.compile(mock.response.body);
            this.compilationError = null;
        } catch(e) {
            this.bodyTemplate = null;
            this.compilationError = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Mock '${mock.method} ${mock.path}' has an invalid template body: ${this.compilationError}`);
        }
    }

    public handle = async (request: Request, h: ResponseToolkit): Promise<ResponseObject> => {
        // Setting logger label
        request['_label'] = 'mock';

        if(this.compilationError) {
            throw Boom.internal(`This mock has an invalid template body: ${this.compilationError}`);
        }

        debug('creating context');
        const context = this.buildContext(request);
        const data = this.buildData();
        debug('building body from bigodon template');
        const renderedBody = await this.buildBody(context, data);
        const resBody = this.normalizeBody(renderedBody, data);

        if(this.mock.response.delay) {
            debug(`waiting ${this.mock.response.delay} ms`)
            await Hoek.wait(this.mock.response.delay);
        }

        if(data.proxyTo !== undefined) {
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
            status: this.mock.response.code,
            responseHeaders: { ...this.mock.response.headers },
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
            return await this.bodyTemplate!(context, { data });
        } catch(e) {
            debug('failed to build body from template, registering failure');
            await this.registerFailure(e);
            this.logger.error(e);
            debug('done');
            throw e;
        }
    }

    private normalizeBody(renderedBody: string, data: BigodonData): string {
        const contentType = this.getEffectiveHeader(data.responseHeaders, 'content-type');

        if(!contentType && renderedBody.trim() === '') {
            return '';
        }

        if(contentType && !this.isJsonContentType(contentType)) {
            return renderedBody;
        }

        try {
            const parsed = JSON.parse(renderedBody);

            if(!contentType) {
                data.responseHeaders['Content-Type'] = 'application/json';
            }

            return JSON.stringify(parsed, null, 2);
        } catch {
            if(!contentType) {
                this.logger.warn('Response is missing Content-Type, rendered body was not valid JSON, returning the raw body as text/plain');
                data.responseHeaders['Content-Type'] = 'text/plain';
                return renderedBody;
            }

            this.logger.error('Response declared a JSON Content-Type, but the rendered body was not valid JSON, returning the raw body');
            return renderedBody;
        }
    }

    private getEffectiveHeader(headers: Record<string, string>, target: string): string | undefined {
        const normalizedTarget = target.toLowerCase();

        for(const [key, value] of Object.entries(headers).reverse()) {
            if(key.toLowerCase() === normalizedTarget) {
                return value;
            }
        }

        return undefined;
    }

    private isJsonContentType(contentType: string): boolean {
        return contentType.toLowerCase().includes('json');
    }

    private async registerFailure(error: Error): Promise<void> {
        if(!this.mock.id) {
            return;
        }

        const failure = new MockFailure(error.toString(), new Date());
        await this.repository.saveFailure(this.mock.id, failure);
    }
}
