import {Service} from "../../utils/decorators/service";
import { FlagRepository } from "./flag.repository";

@Service()
export class FlagMemoryRepository implements FlagRepository {
    private readonly flags: Map<string, any> = new Map();

    async set(key: string, value: any, _ttlMillis?: number): Promise<void> {
        this.flags.set(key, value);
    }

    async get(key: string): Promise<any> {
        return this.flags.get(key);
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
