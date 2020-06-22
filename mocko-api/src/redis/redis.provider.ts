import {Inject, Injectable} from '@nestjs/common';
import * as Redis from 'ioredis';
import {REDIS_CONNECTOR} from './redis.constants';

@Injectable()
export class RedisProvider {
    constructor(
        @Inject(REDIS_CONNECTOR)
        private readonly connector: Redis.Redis,
    ) { }

    async set<T>(key: string, value: T, expiration?: number) {
        if (typeof expiration === 'undefined') {
            await this.connector.set(key, JSON.stringify(value));
        } else {
            await this.connector.set(key, JSON.stringify(value), 'PX', expiration);
        }
    }

    async get<T>(key: string): Promise<T> {
        const str = await this.connector.get(key);
        return JSON.parse(str) as T;
    }
}
