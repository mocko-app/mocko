export interface FlagRepository {
    set(key: string, value: any, ttlMillis: number): Promise<void>;
    get(key: string): Promise<any>;
    del(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
}
