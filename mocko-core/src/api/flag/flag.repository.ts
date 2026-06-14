export const FLAG_SOURCES = ['MOCK', 'CONTROL', 'SDK'] as const;
export type FlagSource = typeof FLAG_SOURCES[number];

export type Flag = {
    value: any;
    mockUpdatedAt?: string;
    controlUpdatedAt?: string;
    sdkUpdatedAt?: string;
};

export interface FlagRepository {
    set(key: string, value: any, source: FlagSource, ttlMillis?: number): Promise<Flag>;
    get(key: string): Promise<Flag | null>;
    del(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    listFlags(prefix: string): Promise<string[]>;
}
