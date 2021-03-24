import { affect, state } from "@mocko/resync";

function validate(key: string): void {
    if(typeof key !== "string") {
        throw new TypeError("Variable names must be strings");
    }

    if(!key.length) {
        throw new TypeError("Variable names cannot be empty");
    }

    if(!/^\w*$/.test(key)) {
        throw new TypeError("Variable names must contain only A-Za-z0-9_");
    }
}

export function getVar(key: any): any {
    validate(key);
    return state(() => this.var[key]);
}

export function setVar(key: any, value: any): void {
    validate(key);
    affect(() => this.var[key] = value);
}
