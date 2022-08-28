import {Inject, Injectable, OnApplicationShutdown} from '@nestjs/common';
import * as Redis from 'ioredis';
import { configService } from '../config/config.service';
import {REDIS_CONNECTOR} from './redis.constants';

const REDIS_PREFIX = configService.get('REDIS_PREFIX');

@Injectable()
export class RedisProvider implements OnApplicationShutdown {
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

    async getRaw(key: string): Promise<string> {
        return await this.connector.get(key);
    }

    async get<T>(key: string): Promise<T> {
        const str = await this.connector.get(key);
        return JSON.parse(str) as T;
    }

    async hget<T>(key: string, mapKey: string): Promise<T> {
        const value = await this.connector.hget(key, mapKey);
        return JSON.parse(value) as T;
    }

    async hset<T>(key: string, mapKey: string, mapValue: T) {
        await this.connector.hset(key, mapKey, JSON.stringify(mapValue));
    }

    async hdel(key: string, mapKey: string) {
        await this.connector.hdel(key, mapKey);
    }

    async del(key: string) {
        await this.connector.del(key);
    }

    async getAll<T>(key: string): Promise<Record<string, T>> {
        const map: Record<string, string> = await this.connector.hgetall(key);
        const entries = Object.entries(map).map(([key, value]) => [key, JSON.parse(value)]);

        return Object.fromEntries(entries);
    }

    async publish(channel: string, message = '') {
        await this.connector.publish(REDIS_PREFIX + channel, message);
    }

    async ping() {
        return await this.connector.ping();
    }

    async keys(prefix: string): Promise<string[]> {
        return await this.connector.keys(`${prefix}*`);
    }

    onApplicationShutdown() {
        this.connector.disconnect();
    }
}
