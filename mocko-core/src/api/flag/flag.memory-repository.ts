import {Service} from "../../utils/decorators/service";
import { Flag, FlagRepository, FlagSource } from "./flag.repository";

type MemoryFlag = {
    value: any;
    expiresAt?: number;
};

@Service()
export class FlagMemoryRepository implements FlagRepository {
    private readonly flags: Map<string, MemoryFlag> = new Map();

    async set(key: string, value: any, _source: FlagSource, ttlMillis?: number): Promise<Flag> {
        this.flags.set(key, { value, expiresAt: this.expirationFor(key, ttlMillis) });
        return { value };
    }

    async get(key: string): Promise<Flag | null> {
        const flag = this.getLive(key);
        if(!flag) {
            return null;
        }

        return { value: flag.value };
    }

    async del(key: string): Promise<void> {
        this.flags.delete(key);
    }

    async has(key: string): Promise<boolean> {
        return this.getLive(key) !== null;
    }

    async listFlags(prefix: string): Promise<string[]> {
        return Array.from(this.flags.keys())
            .filter((key) => key.startsWith(prefix) && this.getLive(key))
            .sort((a, b) => a.localeCompare(b));
    }

    private expirationFor(key: string, ttlMillis?: number): number | undefined {
        if(ttlMillis) {
            return Date.now() + ttlMillis;
        }

        return this.getLive(key)?.expiresAt;
    }

    private getLive(key: string): MemoryFlag | null {
        const flag = this.flags.get(key);
        if(!flag) {
            return null;
        }

        if(flag.expiresAt && flag.expiresAt <= Date.now()) {
            this.flags.delete(key);
            return null;
        }

        return flag;
    }
}
