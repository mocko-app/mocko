import { Data } from "../definitions/data/data";

export function mergeRecords<T>(records: Record<string, T>[]): Record<string, T> {
    const merged: Record<string, T> = {};

    for(const record of records) {
        for(const [key, values] of Object.entries(record)) {
            const existingValues = merged[key];

            if(Array.isArray(existingValues) && Array.isArray(values)) {
                merged[key] = [...existingValues, ...values] as T;
                continue;
            }

            merged[key] = values;
        }
    }

    return merged;
}

export function mergeData(dataBlocks: Data[]): Data {
    const merged: Data = {};

    for(const dataBlock of dataBlocks) {
        for(const [blockName, entry] of Object.entries(dataBlock)) {
            if(!merged[blockName]) {
                merged[blockName] = entry;
                continue;
            }

            merged[blockName] = mergeRecords([merged[blockName], entry]);
        }
    }

    return merged;
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
