import { MockoExecution } from "../api/mock/mock.handler";
import { Host } from "../definitions/data/host";
import { DefinitionProvider } from "src/definitions/definition.provider";
import { firstString } from "../utils/utils";

export function setStatus(this: MockoExecution, status: unknown): void {
    let statusCode: number;
    if (typeof status === 'string') {
        statusCode = parseInt(status, 10);
    } else if (typeof status === 'number') {
        statusCode = status;
    } else {
        throw new TypeError('Status must be a number');
    }

    if (isNaN(statusCode)) {
        throw new TypeError('Status must be a number');
    }

    if (statusCode < 200 || statusCode >= 600) {
        throw new TypeError('Status must be between 200 and 599');
    }

    this.data.status = statusCode;
}

export function setHeader(this: MockoExecution, key: unknown, value: unknown): void {
    if(typeof key !== 'string' || typeof value !== 'string') {
        throw new TypeError('Headers must be strings');
    }

    this.data.responseHeaders[key] = value;
}

function findHostBySlug(hosts: Host[], slug: string): Host | undefined {
    return hosts.find(h => h.slug.toLowerCase() === slug.toLowerCase());
}

function getHost(hosts: Host[], proxyUri: string, header: string): [string, string | null] {
    if(typeof proxyUri !== 'string') {
        const hostByHeader = hosts.find(h => h.source.toLowerCase() === header);
        if(!hostByHeader?.destination) {
            return ['', null];
        }

        return [hostByHeader.destination, '@' + hostByHeader.slug];
    }

    if(!proxyUri.startsWith('@')) {
        const hostBySlug = findHostBySlug(hosts, proxyUri);
        if(!hostBySlug?.destination) {
            return [proxyUri, null];
        }

        return [hostBySlug.destination, '@' + hostBySlug.slug];
    }

    const slug = proxyUri.slice(1);
    const host = findHostBySlug(hosts, slug);
    if(!host) {
        throw new Error(`No host found with slug '${slug}'`);
    }
    if(!host.destination) {
        throw new Error(`Host '${slug}' has no destination to proxy to`);
    }

    return [host.destination, '@' + host.slug];
}

export const proxy = (definitionProvider: DefinitionProvider) => async function (this: MockoExecution, proxyUri?: string): Promise<void> {
    const hosts = (await definitionProvider.getDefinitions()).hosts;
    const [url, label] = getHost(hosts, proxyUri, firstString(this.contexts[0].request.headers.host));

    this.data.proxyTo = url;
    this.data.proxyLabel = label;
    this.halt();
};
