import { v4 } from 'uuid';

export function uuid() {
    return v4();
}

export function substring(str: any, start: any, end: any, options?: object): string {
    if(typeof str === 'undefined' || str === null) {
        throw new TypeError('Cannot get a substring of ' + str);
    }

    if(isNaN(start)) {
        throw new TypeError('Substring start must be a number, got ' + start);
    }

    if(typeof options !== 'undefined' && isNaN(end)) {
        throw new TypeError('Substring end must be a number or undefined, got ' + end);
    }

    return str.toString().substring(parseInt(start), options ? parseInt(end) : void 0);
}
