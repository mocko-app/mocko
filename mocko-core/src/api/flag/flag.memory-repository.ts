import {Service} from "../../utils/decorators/service";
import { Flag, FlagRepository, FlagSource } from "./flag.repository";

@Service()
export class FlagMemoryRepository implements FlagRepository {
    private readonly flags: Map<string, any> = new Map();

    async set(key: string, value: any, _source: FlagSource, _ttlMillis?: number): Promise<Flag> {
        this.flags.set(key, value);
        return { value };
    }

    async get(key: string): Promise<Flag | null> {
        if(!this.flags.has(key)) {
            return null;
        }

        const value = this.flags.get(key);
        return { value };
    }

    async del(key: string): Promise<void> {
        this.flags.delete(key);
    }

    async has(key: string): Promise<boolean> {
        return this.flags.has(key);
    }

    async listFlags(prefix: string): Promise<string[]> {
        return Array.from(this.flags.keys())
            .filter((key) => key.startsWith(prefix))
            .sort((a, b) => a.localeCompare(b));
    }
}
