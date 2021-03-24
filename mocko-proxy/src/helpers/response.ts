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

export function proxy(proxyUri: any, options): void {
    options.data.root.response.proxyTo = typeof proxyUri === 'string' ? proxyUri : '';
}
