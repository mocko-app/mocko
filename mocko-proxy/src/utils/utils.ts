export function mergeRecords(array: Record<string, any[]>[]): Record<string, any[]> {
    const output = {};

    for(const obj of array) {
        for(const key in obj) {
            output[key] = output[key] ? [...output[key], ...obj[key]] : obj[key];
        }
    }

    return output;
}

export function firstString(value: string | string[] | undefined): string {
    return Array.isArray(value) ? (value[0] || '') : (value || '');
}

export type TryCatchResult<T, E = Error> =
    | [result: T, error: null]
    | [result: null, error: E];

export function tryCatchSync<T, E = Error>(callback: () => T): TryCatchResult<T, E> {
    try {
        return [callback(), null];
    } catch(error) {
        return [null, error as E];
    }
}

export async function tryCatch<T, E = Error>(callback: () => Promise<T>): Promise<TryCatchResult<T, E>> {
    try {
        return [await callback(), null];
    } catch(error) {
        return [null, error as E];
    }
}
