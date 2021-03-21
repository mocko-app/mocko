import { RedisProvider } from "../../redis/redis.provider";
import {Service} from "../../utils/decorators/service";
import { FlagRepository } from "./flag.repository";

@Service()
export class FlagRedisRepository implements FlagRepository {
    private readonly FLAG_PREFIX = 'flags:';

    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async set(key: string, value: any): Promise<void> {
        await this.redis.set(this.FLAG_PREFIX + key, value);
    }

    async get(key: string): Promise<any> {
        return await this.redis.get(this.FLAG_PREFIX + key);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(this.FLAG_PREFIX + key);
    }

    async has(key: string): Promise<boolean> {
        const value = await this.get(key);
        return value !== null;
    }
}
