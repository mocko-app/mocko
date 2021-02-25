export function isStream(candidate: any): boolean {
    return candidate !== null &&
        typeof candidate === 'object' &&
        typeof candidate['pipe'] === 'function';
}
