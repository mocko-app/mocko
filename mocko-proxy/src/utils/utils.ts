export function mergeRecords(array: Record<string, any[]>[]): Record<string, any[]> {
    const output = {};

    for(const obj of array) {
        for(const key in obj) {
            output[key] = output[key] ? [...output[key], ...obj[key]] : obj[key];
        }
    }

    return output;
}
