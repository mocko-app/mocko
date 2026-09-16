import * as Wreck from '@mocko/wreck';
import Bigodon from 'bigodon';
import { inject } from 'inversify';
import { Service } from "../../utils/decorators/service";
import { ILogger, Logger } from "../../utils/logger";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { Callback } from "../../definitions/data/callback";
import { Host } from "../../definitions/data/host";
import { FlagService } from "../flag/flag.service";
import * as LogHelpers from "../../helpers/log";
import * as FlagHelpers from "../../helpers/flag";
import { PendingCallback } from "./callback.repository";
import { callbackDebugInfo } from "../../utils/callback-debug";

const debug = require('debug')('mocko:proxy:callback:delivery');
const payloadDebug = require('debug')('mocko:proxy:callback:payload');

const DELIVERY_TIMEOUT_MS = 30_000;

type RenderContext = {
    payload: unknown,
    data: Record<string, any>,
};

@Service()
export class CallbackDeliveryService {
    private readonly bigodon = new Bigodon();

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly definitionProvider: DefinitionProvider,
        private readonly flagService: FlagService,
    ) {
        this.registerHelpers();
    }

    async deliver(pending: PendingCallback): Promise<void> {
        try {
            await this.doDeliver(pending);
        } catch(e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Dropping callback '${pending.slug}' (${pending.id}): ${message}`);
        }
    }

    private async doDeliver(pending: PendingCallback): Promise<void> {
        debug(
            `callback '%s' (%s) timing: pid=%d createdAt=%d dueAt=%d latenessMs=%d triggeredByMockId=%s`,
            pending.slug,
            pending.id,
            process.pid,
            pending.createdAt,
            pending.dueAt,
            Date.now() - pending.dueAt,
            pending.triggeredByMockId
        );
        const definitions = await this.definitionProvider.getDefinitions();
        const definition = definitions.callbacks
            .find((callback) => callback.slug === pending.slug);

        if(!definition) {
            throw new Error(`no callback definition found with slug '${pending.slug}', it may have been removed while the callback was pending`);
        }

        if(debug.enabled) {
            debug('callback %s selected definition: %j', pending.id, callbackDebugInfo(definition));
        }
        payloadDebug('callback %s (%s) delivery input=%j template=%j', pending.id, pending.slug, pending.payload, definition.body);

        const context: RenderContext = {
            payload: pending.payload,
            data: definitions.data || {},
        };

        const url = await this.resolveUrl(definition, definitions.hosts, context, pending.id);
        const body = typeof definition.body === 'string'
            ? await this.render(definition.body, context)
            : undefined;
        const headers = await this.renderHeaders(definition, body, context);

        debug(`sending callback '${pending.slug}' (${pending.id}): ${definition.method} ${url}`);
        payloadDebug('callback %s (%s) outgoing body=%j', pending.id, pending.slug, body);
        const res = await Wreck.request(definition.method, url, {
            payload: body,
            headers,
            timeout: DELIVERY_TIMEOUT_MS,
        });
        await Wreck.read(res);

        const status = res.statusCode ?? 0;
        if(status < 200 || status >= 300) {
            this.logger.warn(`Callback '${pending.slug}' (${pending.id}) delivery to ${definition.method} ${url} returned status ${status}`);
            return;
        }

        debug(`callback '${pending.slug}' (${pending.id}) delivered with status ${status}`);
    }

    private async resolveUrl(definition: Callback, hosts: Host[], context: RenderContext, pendingId: string): Promise<string> {
        if(definition.url) {
            return await this.render(definition.url, context);
        }

        const slug = definition.host!.toLowerCase();
        const host = hosts.find((item) => item.slug.toLowerCase() === slug);
        if(!host) {
            throw new Error(`no host found with slug '${definition.host}'`);
        }
        if(!host.destination) {
            throw new Error(`host '${definition.host}' has no destination to deliver to`);
        }

        if(debug.enabled) {
            debug('callback %s resolved host: selected=%j matches=%j', pendingId, host, hosts.filter((item) => item.slug.toLowerCase() === slug));
        }

        const path = await this.render(definition.path!, context);
        return this.joinUrl(host.destination, path);
    }

    private async renderHeaders(
        definition: Callback,
        body: string | undefined,
        context: RenderContext,
    ): Promise<Record<string, string>> {
        const headers: Record<string, string> = {};
        for(const [key, value] of Object.entries(definition.headers)) {
            headers[key] = await this.render(value, context);
        }

        const hasContentType = Object.keys(headers)
            .some((key) => key.toLowerCase() === 'content-type');
        if(typeof body === 'string' && !hasContentType) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    private async render(template: string, context: RenderContext): Promise<string> {
        const runner = this.bigodon.compile(template);
        return await runner(context);
    }

    private joinUrl(destination: string, path: string): string {
        const base = destination.replace(/\/+$/, '');
        if(!path) {
            return base;
        }

        return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    }

    private registerHelpers(): void {
        this.bigodon.addHelper('log', LogHelpers.log(this.logger));
        this.bigodon.addHelper('warn', LogHelpers.warn(this.logger));
        this.bigodon.addHelper('error', LogHelpers.error(this.logger));

        this.bigodon.addHelper('getFlag', FlagHelpers.getFlag(this.flagService));
        this.bigodon.addHelper('setFlag', FlagHelpers.setFlag(this.flagService));
        this.bigodon.addHelper('delFlag', FlagHelpers.delFlag(this.flagService));
        this.bigodon.addHelper('hasFlag', FlagHelpers.hasFlag(this.flagService));
    }
}
