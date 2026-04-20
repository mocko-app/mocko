import { RedisProvider } from "../../redis/redis.provider";
import {Service} from "../../utils/decorators/service";
import { FlagRepository } from "./flag.repository";
import * as Boom from "@hapi/boom";

@Service()
export class FlagRedisRepository implements FlagRepository {
    private readonly FLAG_PREFIX = 'flags:';
    private readonly MANAGED_API_UNSUPPORTED_MESSAGE =
        'Redis flags cannot be accessed via api here';

    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async set(key: string, value: any, ttlMillis?: number): Promise<void> {
        await this.redis.set(this.FLAG_PREFIX + key, value, ttlMillis);
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

    async listFlags(_prefix: string): Promise<string[]> {
        throw Boom.badData(this.MANAGED_API_UNSUPPORTED_MESSAGE);
    }
}
