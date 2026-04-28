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

function getHost(hosts: Host[], proxyUri: string, header: string): [string, string | null] {
    if(typeof proxyUri === 'string') {
        const hostBySlug = hosts.find(h => h.slug.toLowerCase() === proxyUri.toLowerCase());
        if(hostBySlug?.destination) {
            return [hostBySlug.destination, '@' + hostBySlug.slug];
        }

        return [proxyUri, null];
    }

    const hostByHeader = hosts.find(h => h.source.toLowerCase() === header);
    if(hostByHeader?.destination) {
        return [hostByHeader.destination, '@' + hostByHeader.slug];
    }

    return ['', null];
}

export const proxy = (definitionProvider: DefinitionProvider) => async function (this: MockoExecution, proxyUri?: string): Promise<void> {
    const hosts = (await definitionProvider.getDefinitions()).hosts;
    const [url, label] = getHost(hosts, proxyUri, firstString(this.contexts[0].request.headers.host));

    this.data.proxyTo = url;
    this.data.proxyLabel = label;
    this.halt();
};
