import { MockoExecution } from "../api/mock/mock.handler";

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

export function getVar(this: MockoExecution, key: any): any {
    validate(key);
    return this.data.vars[key];
}

export function setVar(this: MockoExecution, key: any, value: any): void {
    validate(key);
    this.data.vars[key] = value;
}
