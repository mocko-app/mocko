import { RedisProvider } from "../../redis/redis.provider";
import {Service} from "../../utils/decorators/service";
import { Flag, FlagRepository, FlagSource } from "./flag.repository";
import * as Boom from "@hapi/boom";

@Service()
export class FlagRedisRepository implements FlagRepository {
    private readonly FLAG_PREFIX = 'flags:';
    private readonly MANAGED_API_UNSUPPORTED_MESSAGE =
        'Redis flags cannot be accessed via api here';

    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async set(key: string, value: any, source: FlagSource, ttlMillis?: number): Promise<Flag> {
        const redisKey = this.FLAG_PREFIX + key;
        const fields = this.serializeFlag(value, source);

        if(ttlMillis) {
            const transaction = this.redis.multi();
            transaction.hset(redisKey, fields);
            transaction.pexpire(redisKey, ttlMillis);
            await transaction.exec();
        } else {
            await this.redis.hset(redisKey, fields);
        }

        const flag = await this.get(key);
        if(!flag) {
            throw new Error(`Flag "${key}" was not found after being written`);
        }

        return flag;
    }

    async get(key: string): Promise<Flag | null> {
        const payload = await this.redis.hgetall(this.FLAG_PREFIX + key);
        return this.deserializeFlag(payload);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(this.FLAG_PREFIX + key);
    }

    async has(key: string): Promise<boolean> {
        const value = await this.redis.hget(this.FLAG_PREFIX + key, 'value');
        return value !== null;
    }

    async listFlags(_prefix: string): Promise<string[]> {
        throw Boom.badData(this.MANAGED_API_UNSUPPORTED_MESSAGE);
    }

    private serializeFlag(value: any, source: FlagSource): Record<string, string> {
        return {
            value: JSON.stringify(value),
            [this.updatedAtField(source)]: new Date().toISOString(),
        };
    }

    private deserializeFlag(payload: Record<string, string>): Flag | null {
        if(typeof payload.value === 'undefined') {
            return null;
        }

        return {
            value: JSON.parse(payload.value),
            mockUpdatedAt: payload.mockUpdatedAt || undefined,
            controlUpdatedAt: payload.controlUpdatedAt || undefined,
            sdkUpdatedAt: payload.sdkUpdatedAt || undefined,
        };
    }

    private updatedAtField(source: FlagSource): 'mockUpdatedAt' | 'controlUpdatedAt' | 'sdkUpdatedAt' {
        switch(source) {
            case 'MOCK':
                return 'mockUpdatedAt';
            case 'CONTROL':
                return 'controlUpdatedAt';
            case 'SDK':
                return 'sdkUpdatedAt';
        }
    }
}
