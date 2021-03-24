export function setStatus(status: any): void {
    if(isNaN(status)) {
        throw new TypeError('Status must be a number');
    }

    if(status < 200 || status >= 600) {
        throw new TypeError('Status must be between 200 and 599');
    }

    this.response.status = parseInt(status);
}

export function setHeader(key: any, value: any): void {
    if(typeof key !== 'string' || typeof value !== 'string') {
        throw new TypeError('Headers must be strings');
    }

    this.response.headers[key] = value;
}

export function proxy(proxyUri: any): void {
    this.response.proxyTo = typeof proxyUri === 'string' ? proxyUri : '';
}
