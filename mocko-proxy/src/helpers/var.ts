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

export function getVar(key: any, options): any {
    validate(key);
    return state(() => options.data.root.var[key]);
}

export function setVar(key: any, value: any, options): void {
    validate(key);
    affect(() => options.data.root.var[key] = value);
}
