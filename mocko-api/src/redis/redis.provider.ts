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

    async hset<T>(key: string, mapKey: string, mapValue: T) {
        await this.connector.hset(key, mapKey, JSON.stringify(mapValue));
    }

    async hdel<T>(key: string, mapKey: string) {
        await this.connector.hdel(key, mapKey);
    }

    async getAll<T>(key: string): Promise<Record<string, T>> {
        const map: Record<string, string> = await this.connector.hgetall(key);
        const entries = Object.entries(map).map(([key, value]) => [key, JSON.parse(value)]);

        return Object.fromEntries(entries);
    }

    async publish(channel: string, message = '') {
        await this.connector.publish(channel, message);
    }
}
