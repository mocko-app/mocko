import { MockoExecution } from "../api/mock/mock.handler";
import { Host } from "../definitions/data/host";
import { DefinitionProvider } from "src/definitions/definition.provider";

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
        const hostByName = hosts.find(h => h.name.toLowerCase() === proxyUri.toLowerCase());
        if(hostByName) {
            return [hostByName.destination, '@' + hostByName.name];
        }

        return [proxyUri, null];
    }

    const hostByHeader = hosts.find(h => h.source.toLowerCase() === header);
    if(hostByHeader) {
        return [hostByHeader.destination, '@' + hostByHeader.name];
    }

    return ['', null];
}

export const proxy = (definitionProvider: DefinitionProvider) => async function (this: MockoExecution, proxyUri?: string): Promise<void> {
    const hosts = (await definitionProvider.getDefinitions()).hosts;
    const [url, label] = getHost(hosts, proxyUri, this.contexts[0].request.headers.host);

    this.data.proxyTo = url;
    this.data.proxyLabel = label;
    this.halt();
};
