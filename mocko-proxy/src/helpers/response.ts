import { wait } from "@mocko/resync";
import { Host } from "../definitions/data/host";
import { DefinitionProvider } from "src/definitions/definition.provider";

export function setStatus(status: any, options): void {
    if(isNaN(status)) {
        throw new TypeError('Status must be a number');
    }

    if(status < 200 || status >= 600) {
        throw new TypeError('Status must be between 200 and 599');
    }

    options.data.root.response.status = parseInt(status);
}

export function setHeader(key: any, value: any, options): void {
    if(typeof key !== 'string' || typeof value !== 'string') {
        throw new TypeError('Headers must be strings');
    }

    options.data.root.response.headers[key] = value;
}

function getHost(hosts: Host[], proxyUri: string, header: string): string {
    if(typeof proxyUri === 'string') {
        const hostByName = hosts.find(h => h.name.toLowerCase() === proxyUri.toLowerCase());
        if(hostByName) {
            return hostByName.destination;
        }

        return proxyUri;
    }

    const hostByHeader = hosts.find(h => h.source.toLowerCase() === header);
    if(hostByHeader) {
        return hostByHeader.destination;
    }

    return '';
}

export const proxy = (definitionProvider: DefinitionProvider) => (proxyUri: any, options): void => {
    const hosts = wait(() => definitionProvider.getDefinitions()).hosts;

    options.data.root.response.proxyTo = getHost(hosts, proxyUri, options.data.root.request.headers.host);
};
