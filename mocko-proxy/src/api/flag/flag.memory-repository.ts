import {Service} from "../../utils/decorators/service";
import { FlagRepository } from "./flag.repository";

@Service()
export class FlagMemoryRepository implements FlagRepository {
    private readonly flags: Map<string, any> = new Map();

    async set(key: string, value: any): Promise<void> {
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
}
